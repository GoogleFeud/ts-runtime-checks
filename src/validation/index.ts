/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForInLoop, genForLoop, genIdentifier, genIf, genInstanceof, genLogicalAND, genLogicalOR, genNot, genNum, genPropAccess, genStr, genTypeCmp } from "./utils";
import { getNumFromType, getStrFromType, hasBit, isUtilityType, typeValueToNode } from "../utils";
import { ValidationContext } from "./context";

export interface ValidatedType {
    condition: () => ts.Expression,
    error: () => ts.Statement,
    other?: () => Array<ts.Statement>
}

const SKIP_SYM = Symbol("NoCheck");

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | typeof SKIP_SYM | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.BigInt)) return genTypeCmp(target, "bigint");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (hasBit(t, TypeFlags.ESSymbol)) return genTypeCmp(target, "symbol");
    else if (t.getCallSignatures().length === 1) return genTypeCmp(target, "function");
    else if (t.isClass()) return genNot(genInstanceof(target, t.symbol.name));
    else if (isUtilityType(t, "Range")) {
        const min = getNumFromType(t, 0);
        const max = getNumFromType(t, 1);
        const checks = [];
        if (min) checks.push(factory.createLessThan(target, genNum(min)));
        if (max) checks.push(factory.createGreaterThan(target, genNum(max)));
        if (!checks.length) return genTypeCmp(target, "number"); 
        return genLogicalOR(genTypeCmp(target, "number"), genLogicalOR(...checks));
    }
    else if (isUtilityType(t, "Matches")) {
        const regex = getStrFromType(t, 0);
        if (!regex) return genTypeCmp(target, "string");
        return genLogicalOR(genTypeCmp(target, "string"), genNot(factory.createCallExpression(genPropAccess(factory.createRegularExpressionLiteral(regex), "test"), undefined, [target])));
    }
    else if (isUtilityType(t, "NoCheck")) return SKIP_SYM;
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : ValidatedType | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined | typeof SKIP_SYM; 
    if (type = validateBaseType(t, target)) {
        if (type === SKIP_SYM) return;
        return {
            condition:() => type as ts.Expression,
            error: () => ctx.error(t)
        };
    }
    else if (t.isUnion()) return {
        condition: () => {
            let isOptional, hasArrayCheck = false;
            const checks = [];
            for (const unionType of t.types) {
                if (hasBit(unionType, TypeFlags.Undefined)) isOptional = true;
                else {
                    if (isTupleType(ctx.checker, unionType) || isArrayType(ctx.checker, unionType)) {
                        if (hasArrayCheck) continue;
                        checks.push(genNot(genInstanceof(target, "Array")));
                        hasArrayCheck = true;
                    } else {
                        const type = validateType(unionType, target, ctx);
                        if (type) checks.push(type.condition());
                    }
                }
            }
            if (isOptional) return ctx.genOptional(target, genLogicalAND(...checks));
            else return genLogicalAND(...checks);
        },
        error: () => ctx.error(t)
    };
    else if (type = isArrayType(ctx.checker, t)) return {
        condition: () => genNot(genInstanceof(target, "Array")),
        error: () => ctx.error(t),
        other: () => {
            const index = factory.createUniqueName("i");
            const [Xdefinition, x] = genIdentifier("x", factory.createElementAccessExpression(target, index), ts.NodeFlags.Const);
            ctx.addPath(x, index);
            const validationOfChildren = validate(type as ts.Type, x, ctx);
            ctx.removePath();
            return [genForLoop(
                target, index,
                [
                    Xdefinition,
                    ...validationOfChildren
                ]
            )[0]];
        }
    };
    else if (type = isTupleType(ctx.checker, t)) return {
        condition: () => genNot(genInstanceof(target, "Array")),
        error: () => ctx.error(t),
        other: () => {
            const arr = [];
            for (let i=0; i < (type as Array<ts.Type>).length; i++) {
                const access = factory.createElementAccessExpression(target, i);
                ctx.addPath(access, factory.createNumericLiteral(i));
                arr.push(...validate((type as Array<ts.Type>)[i]!, access, ctx, false));
                ctx.removePath();
            }
            return arr;
        }
    };
    else if (isUtilityType(t, "ExactProps")) {
        const obj = t.aliasTypeArguments?.[0];
        if (!obj) return;
        const validatedObj = validateType(obj, target, ctx);
        if (!validatedObj || !validatedObj.other) return;
        return {
            ...validatedObj,
            other: () => {
                const propName = factory.createUniqueName("name");
                ctx.addPath(target, propName);
                const error = ctx.error(t, ["Property ", " is excessive."]);
                ctx.removePath();
                return [...validatedObj.other!(), genForInLoop(target, propName, 
                    [genIf(genLogicalAND(...obj.getProperties().map(prop => genCmp(propName, genStr(prop.name)))), error)]
                )[0]];
            }
        };
    }
    else if (isUtilityType(t, "CmpKey") && t.aliasTypeArguments) {
        const keyName = getStrFromType(t, 1)!;
        const comparedTo = t.aliasTypeArguments![2]!;
        return {
            condition: () => {
                const objType = t.aliasTypeArguments![0];
                if (!objType || !keyName || !comparedTo) throw new TypeError("Wrong parameters for utility type CmpKey.");
                const valNode = typeValueToNode(comparedTo);
                const propAccess = genPropAccess(target, keyName);
                if (Array.isArray(valNode)) return genLogicalAND(...valNode.map(c => genCmp(propAccess, c)));
                else return genCmp(propAccess, valNode);                
            },
            error: () => {
                ctx.addPath(target, keyName);
                const err = ctx.error(t, [undefined, ` to be ${ctx.checker.typeToString(comparedTo)}.`]);
                ctx.removePath();
                return err;
            }
        };
    }
    else return {
        other: () => {
            const properties = t.getProperties();
            const checks = [];
            for (const prop of properties) {
                if (!prop.valueDeclaration) continue;
                const access = factory.createElementAccessExpression(target, genStr(prop.name));
                ctx.addPath(target, prop.name);
                const typeOfProp = ctx.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration);
                checks.push(...validate(typeOfProp.isUnion() ? typeOfProp.getNonNullableType() : typeOfProp, access, ctx, ts.isPropertySignature(prop.valueDeclaration) ? Boolean(prop.valueDeclaration.questionToken) : false));        
                ctx.removePath();  
            }
            return checks;
        },
        condition: () => genTypeCmp(target, "object"),
        error: () => ctx.error(t)
    };
}

export function validate(t: ts.Type, target: ts.Expression, ctx: ValidationContext, isOptional?: boolean) : Array<ts.Statement> {
    const type = validateType(t, target, ctx);
    if (!type) return [];
    const {condition, error, other} = type;
    if (isOptional) {
        if (other) return [genIf(ctx.exists(target), [genIf(condition(), error()), ...other()])];
        else return [genIf(ctx.genOptional(target, condition()), error())];
    } else {
        const res: Array<ts.Statement> = [genIf(condition(), error())];
        if (other) res.push(...other());
        return res;
    }
}

export function isArrayType(checker: ts.TypeChecker, t: ts.Type) : ts.Type|undefined {
    const node = checker.typeToTypeNode(t, undefined, undefined);
    if (!node) return;
    if (node.kind === ts.SyntaxKind.ArrayType) return checker.getTypeArguments(t as ts.TypeReference)[0];
    return;
}

export function isTupleType(checker: ts.TypeChecker, t: ts.Type) : ReadonlyArray<ts.Type>|undefined {
    const node = checker.typeToTypeNode(t, undefined, undefined);
    if (!node) return;
    if (node.kind === ts.SyntaxKind.TupleType) return checker.getTypeArguments(t as ts.TypeReference);
    return;
}

export {
    ValidationContext
};