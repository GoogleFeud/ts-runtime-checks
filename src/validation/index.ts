/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForLoop, genIdentifier, genIf, genInstanceof, genLogicalAND, genLogicalOR, genNot, genNum, genStr, genTypeCmp } from "./utils";
import { getNumFromType, hasBit, isFromThisLib } from "../utils";
import { ValidationContext } from "./context";

export interface ValidatedType {
    condition: () => ts.Expression,
    error: () => ts.Statement,
    other?: () => Array<ts.Statement>
}

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (t.isClass()) return genNot(genInstanceof(target, t.symbol.name));
    else if (isUtilityType(t, "Range")) return genLogicalOR(genTypeCmp(target, "number"), genLogicalOR(factory.createLessThan(target, genNum(getNumFromType(t, 0))), factory.createGreaterThan(target, genNum(getNumFromType(t, 1)))));
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : ValidatedType | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined; 
    if (type = validateBaseType(t, target)) return {
        condition:() => type as ts.Expression,
        error: () => ctx.error(t)
    };
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
            if (isOptional) return genLogicalAND(ctx.exists(target), genLogicalOR(...checks));
            else return genLogicalOR(...checks);
        },
        error: () => ctx.error(t)
    };
    else if (type = isArrayType(ctx.checker, t))
        return {
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
    else if (type = isTupleType(ctx.checker, t)) {
        const arr = [];
        for (let i=0; i < type.length; i++) {
            const access = factory.createElementAccessExpression(target, i);
            ctx.addPath(access, i.toString());
            arr.push(...validate(type[i]!, access, ctx, false));
            ctx.removePath();
        }
        return {
            condition: () => genNot(genInstanceof(target, "Array")),
            error: () => ctx.error(t),
            other: () => {
                const arr = [];
                for (let i=0; i < (type as Array<ts.Type>).length; i++) {
                    const access = factory.createElementAccessExpression(target, i);
                    ctx.addPath(access, i.toString());
                    arr.push(...validate((type as Array<ts.Type>)[i]!, access, ctx, false));
                    ctx.removePath();
                }
                return arr;
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

export function isUtilityType(type: ts.Type, name: string) : boolean|undefined {
    if (!type.aliasSymbol) return;
    return isFromThisLib(type.aliasSymbol) && type.aliasSymbol.name === name;
}

export {
    ValidationContext
};