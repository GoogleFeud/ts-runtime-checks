/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForLoop, genIdentifier, genIf, genInstanceof, genNot, genTypeCmp, UNDEFINED } from "../codegen";
import { hasBit } from "../utils";
import { ValidationContext } from "./context";

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (t.isClass()) return genInstanceof(target, t.symbol.name);
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext, isOptional?: boolean) : Array<ts.Statement> {
    const result = [];
    let type;
    if (type = isArrayType(ctx.checker, t)) {
        const typeCheck = genIf(
            genNot(genInstanceof(target, "Array")),
            ctx.error(t)
        );
        const index = factory.createUniqueName("i");
        const [Xdefinition, x] = genIdentifier("x", factory.createElementAccessExpression(target, index), ts.NodeFlags.Const);
        ctx.addPath(x, index);
        const validationOfChildren = validateType(type, x, ctx);
        ctx.removePath();
        const loop = genForLoop(
            target, index,
            [
                Xdefinition,
                ...validationOfChildren
            ]
        )[0];
        if (isOptional) result.push(genIf(genCmp(target, UNDEFINED), [typeCheck, loop]));
        else result.push(typeCheck, loop);
    } else if (type = isTupleType(ctx.checker, t)) {
        const arr = [];
        for (let i=0; i < type.length; i++) {
            const access = factory.createElementAccessExpression(target, i);
            ctx.addPath(access, i.toString());
            arr.push(...validateType(type[i]!, access, ctx, false));
            ctx.removePath();
        }
        if (isOptional) result.push(genIf(genCmp(target, UNDEFINED), arr));
        else result.push(...arr);
    } 
    else {
        if (type = validateBaseType(t, target)) {
            const condition = isOptional ? ctx.genOptional(target, type) : type;
            result.push(genIf(condition, ctx.error(t)));
        }
    }
    return result;
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