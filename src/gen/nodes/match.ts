import ts from "typescript";
import {Transformer} from "../../transformer";
import {TypeDataKinds, Validator, genValidator} from "../validators";
import {UNDEFINED, _access, _and, _arr_check, _arrow_fn, _bin, _bool, _call, _ident, _not, _obj_check, _or, BlockLike, _if_chain, _var} from "../expressionUtils";
import {GenResult, NodeGenContext, createContext, genChecks, genNode} from "./";
import {doesAlwaysReturn} from "../../utils";
import { getUnionMembers } from "../../utils/unions";

export interface MatchArm {
    parameter: ts.ParameterDeclaration;
    body: ts.ConciseBody;
    type: Validator;
}

/**
 * This function is able to generate a validation function that consists of **only** expressions. It also:
 *
 * - Doesn't generate errors
 * - Expressions are not negated
 * - Doesn't handle recursive types
 * - Doesn't handle ExactProps
 */
export function genConciseNode(validator: Validator, ctx: NodeGenContext, genBaseCheck = true): GenResult {
    switch (validator.typeData.kind) {
        case TypeDataKinds.Array: {
            const childType = validator.children[0];
            if (!childType) return {condition: genBaseCheck ? _arr_check(validator.expression()) : _bool(true)};
            const childName = _ident("value");
            childType.customExp = childName;
            const childrenCheck = _call(_access(validator.expression(), "every"), [_arrow_fn([childName], genConciseNode(childType, ctx).condition)]);
            return {
                condition: genBaseCheck ? _and([_arr_check(validator.expression()), childrenCheck]) : childrenCheck
            };
        }
        case TypeDataKinds.Tuple: {
            const childrenChecks = validator.children.map(c => genConciseNode(c, ctx).condition);
            return {
                condition: genBaseCheck ? _and([_arr_check(validator.expression()), ...childrenChecks]) : _and(childrenChecks)
            };
        }
        case TypeDataKinds.Union: {
            const {compound, normal, object, canBeUndefined} = getUnionMembers(validator.children);
            const checks = [...normal, ...compound].map(c => genConciseNode(c, ctx, false).condition);
            if (object.length) checks.push(...object.map(([childNode, propNode]) => _and([genConciseNode(propNode, ctx, false).condition, genConciseNode(childNode, ctx, false).condition])));
            return {
                condition: canBeUndefined ? _and([_bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken), _or(checks)]) : _or(checks)
            };
        }
        case TypeDataKinds.Object: {
            const checks = validator.children.map(c => genConciseNode(c, ctx).condition);
            return {
                condition: genBaseCheck ? _and([_not(_obj_check(validator.expression(), validator.typeData.couldBeNull)), ...checks]) : _and(checks)
            };
        }
        case TypeDataKinds.Check: {
            const checks = genChecks(validator.typeData.expressions, validator.typeData.alternatives, validator, ctx.transformer, ctx.origin, false);
            const child = validator.children[0];
            if (child) {
                if (child.isComplexType()) checks.unshift(genConciseNode(child, ctx, genBaseCheck).condition);
                else if (genBaseCheck) checks.unshift(genConciseNode(child, ctx).condition);
            }
            return {
                condition: _and(checks)
            };
        }
        default:
            return {condition: _not(genNode(validator, ctx).condition)};
    }
}

export function genReplacementStmt(transformer: Transformer, fnParam: ts.Identifier, body: ts.ConciseBody, parameter?: ts.ParameterDeclaration): ts.Statement {
    if (!parameter) {
        if (!ts.isBlock(body)) return ts.factory.createReturnStatement(body);
        else return body;
    }
    if (ts.isIdentifier(parameter.name)) {
        const visitor = (node: ts.Node): ts.Node => {
            if (ts.isIdentifier(node) && node.text === parameter.name.getText()) return fnParam;
            else return ts.visitEachChild(node, visitor, transformer.ctx);
        };
        const newBody = ts.visitNode(body, visitor) as ts.ConciseBody;
        if (!ts.isBlock(newBody)) return ts.factory.createReturnStatement(newBody);
        if (!doesAlwaysReturn(newBody)) return ts.factory.createBlock([...newBody.statements, ts.factory.createReturnStatement()]);
        else return newBody;
    } else {
        const stmt = _var(parameter.name, fnParam)[0];
        if (!ts.isBlock(body)) return ts.factory.createBlock([stmt, ts.factory.createReturnStatement(body)]);
        if (!doesAlwaysReturn(body)) return ts.factory.createBlock([stmt, ...body.statements, ts.factory.createReturnStatement()]);
        else return ts.factory.createBlock([stmt, ...body.statements]);
    }
}

export function makeBlock(stmt: ts.Statement): ts.Statement {
    if (ts.isBlock(stmt)) return stmt;
    else return ts.factory.createBlock([stmt]);
}

function addToObjArray<K extends string | number, V>(col: Map<K, V[]>, key: K, arm: V) {
    if (col.has(key)) col.get(key)!.push(arm);
    else col.set(key, [arm]);
}

export function genMatch(transformer: Transformer, functionTuple: ts.ArrayLiteralExpression, noAssert?: boolean): ts.ArrowFunction | undefined {
    const functions = functionTuple.elements.map(el => transformer.checker.getSignatureFromDeclaration(el as ts.SignatureDeclaration)).filter(el => el) as ts.Signature[];
    if (!functions.length) return;

    const fnParam = _ident("value");
    const typeGroups: Map<number, MatchArm[]> = new Map();
    const uniqueChecks: MatchArm[] = [];
    let defaultArm: (Omit<MatchArm, "type" | "parameter"> & {parameter?: ts.ParameterDeclaration}) | undefined;

    for (const sig of functions) {
        const param = sig.parameters[0];
        if (!param || !param.valueDeclaration) {
            if (sig.declaration && ts.isArrowFunction(sig.declaration)) defaultArm = {body: sig.declaration.body};
            continue;
        }
        const paramValueDecl = param.valueDeclaration as ts.ParameterDeclaration;
        if (!ts.isArrowFunction(paramValueDecl.parent)) continue;
        const body = paramValueDecl.parent.body;
        const paramType = genValidator(transformer, transformer.checker.getTypeOfSymbolAtLocation(param, param.valueDeclaration), fnParam.text, fnParam);

        if (!paramType) {
            defaultArm = {parameter: paramValueDecl, body};
            continue;
        }

        if (paramType.typeData.kind === TypeDataKinds.Check) {
            if (paramType.children.length) {
                const child = paramType.children[0] as Validator;
                addToObjArray(typeGroups, child.typeData.kind, {parameter: paramValueDecl, type: paramType, body});
            } else uniqueChecks.push({parameter: paramValueDecl, type: paramType, body});
        } else if (paramType.typeData.kind === TypeDataKinds.Union) {
            const kinds = new Map<number, Validator[]>();
            for (const childType of paramType.children) addToObjArray(kinds, childType.typeData.kind, childType);
            for (const [dataKind, validators] of kinds) {
                if (validators.length === 1) addToObjArray(typeGroups, dataKind, {parameter: paramValueDecl, type: validators[0], body});
                else
                    addToObjArray(typeGroups, dataKind, {
                        parameter: paramValueDecl,
                        type: new Validator(transformer.checker.getAnyType(), fnParam.text, {kind: TypeDataKinds.Union}, fnParam, undefined, validators),
                        body
                    });
            }
        } else {
            if (noAssert && paramType.typeData.kind === TypeDataKinds.Object) {
                const hasLiteralKey = paramType.getFirstLiteralChild();
                if (hasLiteralKey) {
                    addToObjArray(typeGroups, paramType.typeData.kind, {parameter: paramValueDecl, type: hasLiteralKey, body});
                } else addToObjArray(typeGroups, paramType.typeData.kind, {parameter: paramValueDecl, type: paramType, body});
            } else addToObjArray(typeGroups, paramType.typeData.kind, {parameter: paramValueDecl, type: paramType, body});
        }
    }

    const ctx = createContext(transformer, {}, functionTuple);

    // Objects will always get checked last, otherwise sort by weight
    const sortedTypeGroups = [...typeGroups.entries()].sort((a, b) => {
        if (a[0] === TypeDataKinds.Object) return 1;
        else if (b[0] === TypeDataKinds.Object) return -1;
        return a[1].reduce((acc, w) => w.type.weigh() + acc, 0) - b[1].reduce((acc, w) => w.type.weigh() + acc, 0);
    });

    const finalStatements = [];
    const statements: [ts.Expression, BlockLike][] = uniqueChecks.map<[ts.Expression, BlockLike]>(c => [
        genConciseNode(c.type, ctx).condition,
        genReplacementStmt(transformer, fnParam, c.body, c.parameter)
    ]);

    if (sortedTypeGroups.length) {
        for (const [dataKind, arms] of sortedTypeGroups) {
            const inner: [ts.Expression, BlockLike][] = [];
            let simplestArm;

            for (const arm of arms) {
                if (arm.type.isSimple()) {
                    if (!simplestArm) simplestArm = arm;
                    continue;
                }
                const genned = genConciseNode(arm.type, ctx, false);
                inner.push([genned.condition, genReplacementStmt(transformer, fnParam, arm.body, arm.parameter)]);
            }

            const simplestNode = genConciseNode(simplestArm?.type || new Validator(transformer.checker.getAnyType(), fnParam.text, {kind: dataKind}, fnParam), ctx, true);
            statements.push([simplestNode.condition, makeBlock(_if_chain(0, inner, simplestArm ? genReplacementStmt(transformer, fnParam, simplestArm.body, simplestArm.parameter) : undefined)!)]);
        }
    }

    finalStatements.push(_if_chain(0, statements)!);

    if (defaultArm) {
        const replaced = genReplacementStmt(transformer, fnParam, defaultArm.body, defaultArm.parameter);
        if (ts.isBlock(replaced)) finalStatements.push(...replaced.statements);
        else finalStatements.push(replaced);
    }

    return ts.factory.createArrowFunction(
        undefined,
        undefined,
        [ts.factory.createParameterDeclaration(undefined, undefined, fnParam)],
        undefined,
        undefined,
        ts.factory.createBlock(finalStatements, true)
    );
}
