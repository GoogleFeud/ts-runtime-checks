/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";

export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}

export function isTrueType(t: ts.Type|undefined) : boolean {
    if (!t) return false;
    //@ts-expect-error Private API
    return t.intrinsicName === "true";
}

export function resolveAsChain(exp: ts.Expression) : ts.Expression {
    while (ts.isAsExpression(exp)) {
        exp = exp.expression;
    }
    return exp;
}