/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";


export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}

export function isFromThisLib(symbol: ts.Symbol) : boolean|undefined {
    return symbol.declarations && symbol.declarations[0]?.getSourceFile().fileName.includes("ts-runtime-checks");
}

export function getNumFromType(t: ts.Type, argNum: number) : number {
    const arg = t.aliasTypeArguments![argNum]!;
    return (arg as ts.NumberLiteralType).value || 0;
}

export function getStrFromType(t: ts.Type, argNum: number) : string {
    const arg = t.aliasTypeArguments![argNum]!;
    return (arg as ts.StringLiteralType).value || "";
}