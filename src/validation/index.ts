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

export function validateBaseType(ctx: ValidationContext, t: ts.Type, target: ts.Expression) : [ts.Expression, string?] | typeof SKIP_SYM | undefined {
    if (t.isStringLiteral()) return [genCmp(target, factory.createStringLiteral(t.value))];
    else if (t.isNumberLiteral()) return [genCmp(target, factory.createNumericLiteral(t.value))];
    else if (hasBit(t, TypeFlags.String)) return [genTypeCmp(target, "string")];
    else if (hasBit(t, TypeFlags.BigInt)) return [genTypeCmp(target, "bigint")];
    else if (hasBit(t, TypeFlags.Number)) return [genTypeCmp(target, "number")];
    else if (hasBit(t, TypeFlags.Boolean)) return [genTypeCmp(target, "boolean")];
    else if (hasBit(t, TypeFlags.ESSymbol)) return [genTypeCmp(target, "symbol")];
    else if (hasBit(t, TypeFlags.Null)) return [genCmp(target, factory.createNull())];
    else if (hasBit(t, TypeFlags.Any) || hasBit(t, TypeFlags.Unknown)) return SKIP_SYM;
    else if (t.getCallSignatures().length === 1) return [genTypeCmp(target, "function")];
    else if (t.isClass()) return [genNot(genInstanceof(target, t.symbol.name)), ` to be an instance of ${t.symbol?.name}.`];
    else {
        const utility = ctx.transformer.getUtilityType(t);
        if (!utility || !utility.aliasSymbol || !utility.aliasTypeArguments) return;
        switch (utility.aliasSymbol.name) {
        case "NumRange": {
            const minType = ctx.transformer.getTypeArg(utility, 0);
            const maxType = ctx.transformer.getTypeArg(utility, 1);
            const checks = [];
            if (minType && minType.isNumberLiteral()) checks.push(factory.createLessThan(target, ctx.transformer.typeValueToNode(minType, true)));
            if (maxType && maxType.isNumberLiteral()) checks.push(factory.createGreaterThan(target, ctx.transformer.typeValueToNode(maxType)));
            if (!checks.length) return [genTypeCmp(target, "number")]; 
            let msg = "";
            if (minType) {
                const stringified = ctx.transformer.typeToString(minType);
                if (stringified) msg += `more than ${stringified}`;
            }
            if (maxType) {
                const stringified = ctx.transformer.typeToString(maxType);
                if (stringified) {
                    if (msg.length) msg += " and ";
                    msg += `less than ${stringified}`;
                }
            }
            return [genLogicalOR(genTypeCmp(target, "number"), genLogicalOR(...checks)), ` to be ${msg}.`];
        }
        case "Matches": {
            const regexType = ctx.transformer.getTypeArg(utility, 0);
            if (!regexType || !regexType.isStringLiteral()) return [genTypeCmp(target, "string"), " to be string."];
            const regex = ctx.transformer.typeValueToNode(regexType, true);
            return [genLogicalOR(genTypeCmp(target, "string"), genNot(factory.createCallExpression(genPropAccess(ts.isStringLiteral(regex) ? factory.createRegularExpressionLiteral(regex.text) : regex, "test"), undefined, [target]))), ` to match "${ctx.transformer.typeToString(regexType)}".`];
        }
        case "NoCheck": return SKIP_SYM;
        }
    }
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : ValidatedType | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined | typeof SKIP_SYM; 
    const simpleType = validateBaseType(ctx, t, target);
    if (simpleType) {
        if (simpleType === SKIP_SYM) return;
        return {
            condition:() => simpleType[0],
            error: () => ctx.error(t, [undefined, simpleType[1]])
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
            const types = (type as Array<ts.Type>);
            for (let i=0; i < types.length; i++) {
                const access = factory.createElementAccessExpression(target, i);
                ctx.addPath(access, factory.createNumericLiteral(i));
                if (types[i] !== types[i]!.getNonNullableType()) arr.push(...validate(types[i]!.getNonNullableType(), access, ctx, true));
                else arr.push(...validate(types[i]!, access, ctx, false));
                ctx.removePath();
            }
            return arr;
        }
    };
    else {
        const utility = ctx.transformer.getUtilityType(t);
        switch (utility?.aliasSymbol?.name) {
        case "ExactProps": {
            const obj = ctx.transformer.getTypeArg(utility, 0);
            if (!obj) return;
            if (ctx.exactProps) return validateType(obj, target, ctx);
            ctx.exactProps = true;
            const validatedObj = validateType(obj, target, ctx);
            if (!validatedObj) return;
            return {
                ...validatedObj,
                other: () => {
                    const res = validatedObj.other!();
                    ctx.exactProps = false;
                    return res;
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
        default: {
            const exactProps = ctx.exactProps;
            return {
                other: () => {
                    const properties = t.getProperties();
                    const checks = [];
                    if (exactProps) {
                        const propName = factory.createUniqueName("name");
                        ctx.addPath(target, propName, true);
                        const error = ctx.error(t, ["Property ", " is excessive."]);
                        ctx.removePath();
                        checks.push(genForInLoop(target, propName,
                            [genIf(genLogicalAND(...properties.map(prop => genCmp(propName, genStr(prop.name)))), error)]
                        )[0]);
                    }
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