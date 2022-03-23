/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForLoop, genIdentifier, genIf, genInstanceof, genNot, genTypeCmp } from "./codegen";
import { hasBit } from "../utils";
import { ValidationContext } from "./context";

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (t.isClass()) return genNot(genInstanceof(target, t.symbol.name));
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : {
    condition: () => ts.Expression,
    error: () => ts.Statement,
    other?: () => Array<ts.Statement>,
    isOptional?: boolean
} | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined ;
    if (type = isArrayType(ctx.checker, t)) {
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
    } else if (type = isTupleType(ctx.checker, t)) {
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
    else if (type = validateBaseType(t, target)) return {
        condition:() => type as ts.Expression,
        error: () => ctx.error(t)
    };
    return;
}

export function validate(t: ts.Type, target: ts.Expression, ctx: ValidationContext, isOptional?: boolean) : Array<ts.Statement> {
    const type = validateType(t, target, ctx);
    if (!type) return [];
    if (type.isOptional) isOptional = true;
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