/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import { UNDEFINED } from "./validation/utils";


export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}

export function isFromThisLib(symbol: ts.Symbol) : boolean|undefined {
    return symbol.declarations && symbol.declarations[0]?.getSourceFile().fileName.includes("ts-runtime-checks");
}

export function isUtilityType(type: ts.Type, name: string) : boolean|undefined {
    if (!type.aliasSymbol) return;
    return isFromThisLib(type.aliasSymbol) && type.aliasSymbol.name === name;
}

export function getNumFromType(t: ts.Type, argNum: number) : number|undefined {
    const arg = t.aliasTypeArguments![argNum];
    if (!arg) return;
    return (arg as ts.NumberLiteralType).value;
}

export function getStrFromType(t: ts.Type, argNum: number) : string|undefined {
    const arg = t.aliasTypeArguments![argNum];
    if (!arg) return;
    return (arg as ts.StringLiteralType).value || "";
}

export function typeValueToNode(t: ts.Type) : ts.Expression|Array<ts.Expression> {
    if (t.isStringLiteral()) return ts.factory.createStringLiteral(t.value);
    else if (t.isNumberLiteral()) return ts.factory.createNumericLiteral(t.value);
    else if (isUtilityType(t, "Var")) {
        const strVal = getStrFromType(t, 0);
        return strVal ? ts.factory.createIdentifier(strVal) : UNDEFINED;
    }
    else if (hasBit(t, ts.TypeFlags.BigIntLiteral)) {
        const { value } = (t as ts.BigIntLiteralType);
        return ts.factory.createBigIntLiteral(value);
    }
    else if (t.isUnion()) {
        return t.types.map(t => typeValueToNode(t)) as Array<ts.Expression>;
    }
    //@ts-expect-error Private API
    else if (t.intrinsicName === "false") return ts.factory.createFalse();
    //@ts-expect-error Private API
    else if (t.intrinsicName === "true") return ts.factory.createTrue();
    //@ts-expect-error Private API
    else if (t.intrinsicName === "null") return ts.factory.createNull();
    else return UNDEFINED;
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