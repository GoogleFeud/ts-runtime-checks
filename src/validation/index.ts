/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory, Expression } from "typescript";
import { genCmp, genForLoop, genIdentifier, genIf, genIfElseChain, genInstanceof, genLogicalAND, genNot, genTypeCmp, negate } from "./codegen";
import { hasBit } from "../utils";
import { ValidationContext } from "./context";

export const enum ValidatedTypeOrigin {
    Basic,
    Array,
    Tuple,
    Union
}

export interface ValidatedType {
    condition: () => ts.Expression,
    error: () => ts.Statement,
    other?: () => Array<ts.Statement>,
    origin: ValidatedTypeOrigin
}

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (t.isClass()) return genNot(genInstanceof(target, t.symbol.name));
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext) : Array<ts.Statement> | ValidatedType | undefined {
    let type: ts.Type | ReadonlyArray<ts.Type> | ts.Expression | undefined; 
    if (t.isUnion()) {
        let isOptional;
        const inlineChecks: Array<ts.Expression> = [];
        const otherChecks: Array<ValidatedType> = [];
        for (const unionType of t.types) {
            if (hasBit(unionType, TypeFlags.Undefined)) isOptional = true;
            else {
                const generated = validateType(unionType, target, ctx);
                if (!generated || Array.isArray(generated)) continue;
                else {
                    if (generated.other) otherChecks.push(generated);
                    else inlineChecks.push(negate(generated.condition()));
                }
            }
        }
        if (isOptional) {
            if (!otherChecks.length) return { condition: () => genLogicalAND(ctx.exists(target), genLogicalAND(...inlineChecks)), error: () => ctx.error(t), origin: ValidatedTypeOrigin.Union };
            return [genIf(ctx.exists(target),
                genIfElseChain([
                    [genLogicalAND(ctx.exists(target), genLogicalAND(...inlineChecks)), []],
                    ...otherChecks.map(c => [negate(c.condition()), c.other!()] as [Expression, Array<ts.Node>]) 
                ], 
                ctx.error(t)
                ))];
        } else {
            if (!otherChecks.length) return { condition: () => genLogicalAND(...inlineChecks), error: () => ctx.error(t), origin: ValidatedTypeOrigin.Union };
            return [genIfElseChain([
                [genLogicalAND(...inlineChecks), []],
                ...otherChecks.map(c => [negate(c.condition()), c.other!()]  as [Expression, Array<ts.Node>])
            ], 
            ctx.error(t))];
        }
    }
    else if (type = isArrayType(ctx.checker, t)) {
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
            },
            origin: ValidatedTypeOrigin.Array
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
            },
            origin: ValidatedTypeOrigin.Tuple
        };
    } 
    else if (type = validateBaseType(t, target)) return {
        condition:() => type as ts.Expression,
        error: () => ctx.error(t),
        origin: ValidatedTypeOrigin.Basic
    };
    return;
}

export function validate(t: ts.Type, target: ts.Expression, ctx: ValidationContext, isOptional?: boolean) : Array<ts.Statement> {
    const type = validateType(t, target, ctx);
    if (!type) return [];
    if (Array.isArray(type)) return type;
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