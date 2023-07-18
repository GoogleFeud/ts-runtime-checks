/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import { Transformer } from "./transformer";
import { ValidationResultType } from "./gen/nodes";

export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}

export function isTrueType(t: ts.Type|undefined) : boolean {
    if (!t) return false;
    //@ts-expect-error Private API
    return t.intrinsicName === "true";
}

export function isErrorMessage(t: ts.Type) : boolean {
    return Boolean(t.getProperty("__error_msg"));
}

export function isErrorType(t: ts.Type) : ts.Symbol|undefined {
    return t.getProperty("__throw_err");
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

export function getCallSigFromType(checker: ts.TypeChecker, type: ts.Type) : ts.Signature|undefined {
    const sym = type.getSymbol();
    if (!sym || !sym.declarations?.length) return;
    return checker.getSignatureFromDeclaration((sym.declarations[0] as ts.TypeParameterDeclaration).parent as ts.CallSignatureDeclaration);
}

export function getResolvedTypesFromCallSig(checker: ts.TypeChecker, typeParam: ts.Type[], sig: ts.Signature) : ts.Type[] {
    if (!sig.mapper) return [];
    const resolvedTypes: ts.Type[] = [];
    let sources, targets;
    if (sig.mapper.kind === ts.TypeMapKind.Simple && sig.mapper.source === typeParam[0]) {
        sources = [sig.mapper.source];
        targets = [sig.mapper.target];
    }
    else if (sig.mapper.kind === ts.TypeMapKind.Array && sig.mapper.targets) {
        sources = sig.mapper.sources;
        targets = sig.mapper.targets;
    }
    else return resolvedTypes;
    for (let i=0; i < typeParam.length; i++) {
        const sourceIndex = sources.indexOf(typeParam[i] as ts.Type);
        if (sourceIndex !== -1) resolvedTypes.push(getApparentType(checker, targets[sourceIndex] as ts.Type));
    }
    return resolvedTypes;
}

export function resolveResultType(transformer: Transformer, type?: ts.Type) : ValidationResultType {
    if (!type) return { throw: "Error" };
    const rawErrors = type.getProperty("__raw_error") && isTrueType(transformer.checker.getTypeOfSymbol(type.getProperty("__raw_error") as ts.Symbol));
    if (type.getProperty("__error_msg")) return { returnErr: true, rawErrors };
    else if (type.getProperty("__throw_err")) return { throw: transformer.checker.typeToString(transformer.checker.getTypeOfSymbol(type.getProperty("__throw_err") as ts.Symbol)), rawErrors };
    else return { return: transformer.typeValueToNode(type), rawErrors };
}

export const enum BindingPatternTypes {
    Object,
    Array
}

export function forEachVar(prop: ts.Expression|ts.BindingName|ts.QualifiedName, 
    cb: (i: ts.Expression, bindingPatternType?: BindingPatternTypes) => Array<ts.Statement>,
    parentType?: BindingPatternTypes) : Array<ts.Statement> {
    if (ts.isIdentifier(prop)) return cb(prop, parentType);
    else if (ts.isQualifiedName(prop)) return cb(prop.right, parentType);
    else if (ts.isObjectBindingPattern(prop)) {
        const result = [];
        for (const el of prop.elements) {
            result.push(...forEachVar(el.name, cb, BindingPatternTypes.Object));
        }
        return result;
    } else if (ts.isArrayBindingPattern(prop)) {
        const result = [];
        for (const el of prop.elements) {
            if (ts.isOmittedExpression(el)) continue;
            result.push(...forEachVar(el.name, cb, BindingPatternTypes.Array));
        }
        return result;
    }
    else return cb(prop);
}

export function isInt(str: string|number) : boolean {
    return !isNaN(+str);
}

export function isSingleIfStatement(stmt: ts.Statement) : stmt is ts.IfStatement {
    return ts.isIfStatement(stmt) && ts.isReturnStatement(stmt.thenStatement) && !stmt.elseStatement;
}

export function TransformerError(callSite: ts.Node, msg: string) : void {
    TransformerErrorWrapper(callSite.pos, callSite.end - callSite.pos, msg, callSite.getSourceFile());
    process.exit();
}

export function TransformerErrorWrapper(start: number, length: number, msg: string, file: ts.SourceFile) : void {
    if (!ts.sys || typeof process !== "object") throw new Error(msg);
    console.error(ts.formatDiagnosticsWithColorAndContext([{
        category: ts.DiagnosticCategory.Error,
        code: 8000,
        file,
        start,
        length,
        messageText: msg
    }], {
        getNewLine: () => "\r\n",
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: (fileName) => fileName
    }));
}