/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForInLoop, genForLoop, genIdentifier, genIf, genInstanceof, genLogicalAND, genLogicalOR, genNegate, genNot, genPropAccess, genStr, genTypeCmp } from "./utils";
import { hasBit, isTrueType } from "../utils";
import { ValidationContext } from "./context";

export interface ValidatedType {
    condition: () => ts.Expression,
    error: () => ts.Statement,
    other?: () => Array<ts.Statement>
}

const SKIP_SYM = Symbol("NoCheck");

export function validateBaseType(ctx: ValidationContext, t: ts.Type, target: ts.Expression) : ts.Expression | typeof SKIP_SYM | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.BigInt)) return genTypeCmp(target, "bigint");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (hasBit(t, TypeFlags.ESSymbol)) return genTypeCmp(target, "symbol");
    else if (hasBit(t, TypeFlags.Null)) return genCmp(target, factory.createNull());
    else if (t.getCallSignatures().length === 1) return genTypeCmp(target, "function");
    else if (t.isClass()) return genNot(genInstanceof(target, t.symbol.name));
    else {
        const utility = ctx.transformer.getUtilityType(t);
        if (!utility || !utility.aliasSymbol || !utility.aliasTypeArguments) return;
        switch (utility.aliasSymbol.name) {
        case "Range": {
            const min = ctx.transformer.getNodeFromType(utility, 0);
            const max = ctx.transformer.getNodeFromType(utility, 1);
            const checks = [];
            if (min) checks.push(factory.createLessThan(target, min));
            if (max) checks.push(factory.createGreaterThan(target, max));
            if (!checks.length) return genTypeCmp(target, "number"); 
            return genLogicalOR(genTypeCmp(target, "number"), genLogicalOR(...checks));
        }
        case "Matches": {
            const regex = ctx.transformer.getNodeFromType(utility, 0);
            if (!regex) return genTypeCmp(target, "string");
            return genLogicalOR(genTypeCmp(target, "string"), genNot(factory.createCallExpression(genPropAccess(ts.isStringLiteral(regex) ? factory.createRegularExpressionLiteral(regex.text) : regex, "test"), undefined, [target])));
        }
        case "NoCheck": return SKIP_SYM;
        }
    }
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : ValidatedType | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined | typeof SKIP_SYM; 
    if (type = validateBaseType(ctx, t, target)) {
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
                    if (isTupleType(ctx.transformer.checker, unionType) || isArrayType(ctx.transformer.checker, unionType)) {
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
    else if (type = isArrayType(ctx.transformer.checker, t)) return {
        condition: () => genNot(genInstanceof(target, "Array")),
        error: () => ctx.error(t),
        other: !isNoCheck(ctx, type) ? () => {
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
        } : undefined
    };
    else if (type = isTupleType(ctx.transformer.checker, t)) return {
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
    else {
        const utility = ctx.transformer.getUtilityType(t);
        switch (utility?.aliasSymbol?.name) {
        case "ExactProps": {
            const obj = utility.aliasTypeArguments?.[0];
            if (!obj) return;
            const validatedObj = validateType(obj, target, ctx);
            if (!validatedObj || !validatedObj.other) return;
            return {
                ...validatedObj,
                other: () => {
                    const propName = factory.createUniqueName("name");
                    ctx.addPath(target, propName);
                    const error = ctx.error(utility, ["Property ", " is excessive."]);
                    ctx.removePath();
                    return [...validatedObj.other!(), genForInLoop(target, propName, 
                        [genIf(genLogicalAND(...obj.getProperties().map(prop => genCmp(propName, genStr(prop.name)))), error)]
                    )[0]];
                }
            };
        }
        case "If": {
            if (!utility.aliasTypeArguments) return;
            const type = utility.aliasTypeArguments[0];
            const exp = ctx.transformer.getStringFromType(utility, 1);
            const fullCheck = isTrueType(utility.aliasTypeArguments[2]!);
            if (!type || !exp) return;
            const objValidator = fullCheck ? validateType(type, target, ctx) : undefined;
            const condition = () => genNegate(ctx.transformer.stringToNode(exp, { $self: target }));
            const error = () => ctx.error(utility, [undefined, ` to satisfy \`${exp}\`.`]);
            return {
                condition: objValidator ? objValidator.condition : condition,
                error: objValidator ? objValidator.error : error,
                other: objValidator ? () => {
                    if (objValidator.other) return [...objValidator!.other!(), genIf(condition(), error())];
                    return [genIf(condition(), error())];
                } : undefined
            };
        }
        default: return {
            other: () => {
                const properties = t.getProperties();
                const checks = [];
                for (const prop of properties) {
                    if (prop === t.aliasSymbol) continue;
                    const access = factory.createElementAccessExpression(target, genStr(prop.name));
                    ctx.addPath(target, prop.name);
                    //@ts-expect-error Internal APIs
                    const typeOfProp = (ctx.transformer.checker.getTypeOfSymbol(prop) || ctx.transformer.checker.getNullType()) as ts.Type;
                    // If it's not possible for the type to be undefined
                    if (typeOfProp === typeOfProp.getNonNullableType()) checks.push(...validate(typeOfProp, access, ctx, false));
                    else checks.push(...validate(typeOfProp.getNonNullableType(), access, ctx, true));
                    ctx.removePath();  
                }
                return checks;
            },
            condition: () => genTypeCmp(target, "object"),
            error: () => ctx.error(t)
        };
        }
    }
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

export function isNoCheck(ctx: ValidationContext, t: ts.Type) : boolean {
    const util = ctx.transformer.getUtilityType(t);
    if (!util || !util.aliasSymbol || util.aliasSymbol.name !== "NoCheck") return false;
    return true;
}

export {
    ValidationContext
};