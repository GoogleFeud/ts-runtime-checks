/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import { Transformer } from "./transformer";

export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}

export function isTrueType(t: ts.Type|undefined) : boolean {
    if (!t) return false;
    //@ts-expect-error Private API
    return t.intrinsicName === "true";
}

export function parseJsDocTags(transformer: Transformer, tags: readonly ts.JSDocTag[], expected: string[]) : Record<string, ts.Expression> {
    const result: Record<string, ts.Expression> = {};
    for (const tag of tags) {
        if (!expected.includes(tag.tagName.text) || typeof tag.comment !== "string") continue;
        const tagValue = tag.comment[0] === "{" ? tag.comment.slice(1, -1) : tag.comment;
        const exp = transformer.stringToNode(tagValue);
        result[tag.tagName.text] = exp;
    }
    return result;
}

export function isErrorMessage(t: ts.Type) : boolean {
    return Boolean(t.getProperty("__error_msg"));
}

export function resolveAsChain(exp: ts.Expression) : ts.Expression {
    while (ts.isAsExpression(exp)) {
        exp = exp.expression;
    }
    return exp;
}

export function getStringFromType(t: ts.Type, argNum: number) : string|undefined {
    const arg = t.aliasTypeArguments?.[argNum];
    if (arg && arg.isStringLiteral()) return arg.value;
    return undefined;
}

export function getObjectFromType(checker: ts.TypeChecker, t: ts.Type, argNum: number) : Record<string, ts.Type> {
    const res = {};
    const arg = t.aliasTypeArguments?.[argNum];
    if (!arg) return {};
    for (const prop of arg.getProperties()) {
        //@ts-expect-error Internal APIs
        res[prop.name] = checker.getTypeOfSymbol(prop);
    }
    return res;
}

export function createListOfStr(strings: Array<string>) : string {
    if (strings.length === 1) return strings[0] + ".";
    const clone = [...strings];
    const last = clone.pop();
    return `${clone.join(", ")} and ${last}.`;
}

export function getTypeArg(t: ts.Type, argNum: number) : ts.Type | undefined {
    return t.aliasTypeArguments?.[argNum];
}

export function getApparentType(checker: ts.TypeChecker, t: ts.Type) : ts.Type {
    if (t.isStringLiteral()) return checker.getStringType();
    else if (t.isNumberLiteral()) return checker.getNumberType();
    else return t;
}

export function resolveAliasedSymbol(checker: ts.TypeChecker, sym?: ts.Symbol) : ts.Symbol | undefined {
    if (!sym) return;
    while ((sym.flags & ts.SymbolFlags.Alias) !== 0) {
        const newSym = checker.getAliasedSymbol(sym);
        if (newSym.name === "unknown") return sym;
        sym = newSym;
    }
    return sym;
}