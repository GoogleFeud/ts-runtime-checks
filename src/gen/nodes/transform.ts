import {NodeGenContext, createContext, error, fullValidate} from ".";
import {Transformer} from "../../transformer";
import {genCheckCtx} from "../../utils";
import {getUnionMembers} from "../../utils/unions";
import {BlockLike, UNDEFINED, _access, _and, _arr_check, _assign, _bin, _call, _for, _ident, _if, _if_chain, _not, _obj, _obj_check, _or, _stmt, _str, _var} from "../expressionUtils";
import {TransformTypeData, TypeDataKinds, Validator} from "../validators";
import ts from "typescript";
import {genConciseNode} from "./match";

export interface TransformCtx {
    transformer: Transformer;
    origin: ts.Node;
    validate?: NodeGenContext;
}

export function genTransform(validator: Validator, target: ts.Expression, ctx: TransformCtx, validate: NodeGenContext | false | undefined = ctx.validate): ts.Statement[] {
    const assignTarget = validator.parent && validator.name !== "" ? _access(target, validator.name) : target;

    switch (validator.typeData.kind) {
        case TypeDataKinds.Transform: {
            if (!validator.typeData.transformations.length) return [];
            const prevStmts: ts.Statement[] = [];
            if (validate && validator.typeData.rest) {
                validator.typeData.rest.inherits(validator);
                prevStmts.push(...fullValidate(validator, validate));
            }
            let previousExp = validator.expression();
            for (let i = 0; i < validator.typeData.transformations.length; i++) {
                const code = validator.typeData.transformations[i] as string | ts.Symbol;
                if (typeof code === "string") {
                    if (i !== 0) {
                        const ident = _ident("temp");
                        const exp = ctx.transformer.stringToNode(code, genCheckCtx(ident));
                        prevStmts.push(_var(ident, previousExp, ts.NodeFlags.Const)[0]);
                        previousExp = exp;
                    } else {
                        previousExp = ctx.transformer.stringToNode(code, genCheckCtx(previousExp));
                    }
                } else {
                    const funcIdent = ctx.transformer.importSymbol(code, ctx.origin);
                    if (!funcIdent) continue;
                    previousExp = _call(funcIdent, [previousExp]);
                }
            }

            let nextStmts: ts.Statement[] = [];
            // We use ctx.validate cause nothing can prevent post checks from happening
            if (ctx.validate && validator.typeData.postChecks) {
                const checkValidator = validator.typeData.postChecks;
                if (checkValidator.typeData.kind === TypeDataKinds.Check) checkValidator.setChildren([]);
                checkValidator.setAlias(() => assignTarget as ts.Identifier);
                nextStmts = fullValidate(validator.typeData.postChecks, ctx.validate);
            }
            return [...prevStmts, _stmt(_assign(assignTarget, previousExp)), ...nextStmts];
        }
        case TypeDataKinds.Tuple:
        case TypeDataKinds.Object: {
            const isTuple = validator.typeData.kind === TypeDataKinds.Tuple;
            const initializer = isTuple ? ts.factory.createArrayLiteralExpression() : _obj({});
            const validation: ts.Statement[] = [];
            if (validate) {
                if (isTuple) validation.push(_if(_not(_arr_check(validator.expression())), error(validate, [validator])));
                else validation.push(_if(_obj_check(validator.expression()), error(validate, [validator])));
            }
            return [...validation, _stmt(_assign(assignTarget, initializer)), ...validator.children.map(child => genTransform(child, assignTarget, ctx)).flat()];
        }
        case TypeDataKinds.Array: {
            const childType = validator.children[0];
            if (!childType) return [_stmt(_assign(assignTarget, validator.expression()))];
            let index: ts.Identifier;
            if (typeof childType.name === "object") index = childType.name;
            else {
                index = _ident("i");
                childType.setName(index);
            }
            const validation = validate ? [_if(_not(_arr_check(validator.expression())), error(validate, [validator]))] : [];
            return [...validation, _stmt(_assign(assignTarget, ts.factory.createArrayLiteralExpression())), _for(validator.expression(), index, genTransform(childType, assignTarget, ctx))[0]];
        }
        case TypeDataKinds.Union: {
            const transforms: Validator[] = [],
                regularTypes: Validator[] = [];
            let containsUndefined: Validator | undefined = undefined,
                containsNull: Validator | undefined = undefined;
            for (const child of validator.children) {
                if (child.typeData.kind === TypeDataKinds.Transform) transforms.push(child);
                else if (child.typeData.kind === TypeDataKinds.Undefined) containsUndefined = child;
                else if (child.typeData.kind === TypeDataKinds.Null) containsNull = child;
                else regularTypes.push(child);
            }

            const extraChecks = [];
            if (containsUndefined) extraChecks.push(_bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken));
            if (containsNull) extraChecks.push(_bin(validator.expression(), ts.factory.createNull(), ts.SyntaxKind.ExclamationEqualsEqualsToken));

            if (!transforms.length) {
                if (extraChecks.length) return [_if(_and(extraChecks), regularTypes.map(type => genTransform(type, assignTarget, ctx, validate)).flat())];
                else return [_stmt(_assign(assignTarget, validator.expression()))];
            }

            if (!transforms.length) return regularTypes.map(t => genTransform(t, assignTarget, ctx, validate)).flat();

            const bases: Validator[] = [],
                withoutBases: Validator[] = [];
            for (const transform of transforms) {
                const typeData = transform.typeData as TransformTypeData;
                if (typeData.rest) bases.push(typeData.rest);
                else withoutBases.push(transform);
            }
            const {normal, compound} = getUnionMembers(bases, false);
            const nodeCtx = validate || createContext(ctx.transformer, {none: true}, ctx.origin);

            const ifChecks: [ts.Expression, BlockLike][] = [...normal, ...compound].map(validator => {
                const check = genConciseNode(validator, nodeCtx);
                const originalTransform = transforms[bases.indexOf(validator)]!;

                return [check.condition, genTransform(originalTransform, assignTarget, ctx, false)];
            });

            let elseStmt;
            if (withoutBases.length === 1) {
                elseStmt = genTransform(withoutBases[0]!, assignTarget, ctx, false);
            } else if (validate) {
                elseStmt = error(validate, [validator, [_str("to be one of "), _str(validator.children.map(base => base.translate()).join(" | "))]]);
                if (regularTypes.length) {
                    const conditions = regularTypes.map(t => genConciseNode(t, nodeCtx).condition);
                    if (conditions.length) ifChecks.push([_or(conditions), _stmt(_assign(assignTarget, validator.expression()))]);
                }
            } else {
                elseStmt = _stmt(_assign(assignTarget, validator.expression()));
            }

            let result = _if_chain(0, ifChecks, elseStmt) as ts.Statement;

            if (extraChecks.length) result = _if(_and(extraChecks), result);

            return [result];
        }
        default: {
            const statements: ts.Statement[] = [];
            if (validate) statements.push(...fullValidate(validator, validate));
            return [...statements, _stmt(_assign(assignTarget, validator.expression()))];
        }
    }
}
