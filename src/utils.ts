import ts from "typescript";
import type {CodeReferenceReplacement, Transformer} from "./transformer";
import {type ValidationResultType} from "./gen/nodes";
import {Validator} from "./gen/validators";
import {UNDEFINED, _var} from "./gen/expressionUtils";
import {Block} from "./block";

export function hasBit(thing: {flags: number}, bit: number): boolean {
    return (thing.flags & bit) !== 0;
}

export function isTrueType(t: ts.Type | undefined): boolean {
    if (!t) return false;
    //@ts-expect-error Private API
    return t.intrinsicName === "true";
}

export function resolveAsChain(exp: ts.Expression): ts.Expression {
    while (ts.isAsExpression(exp)) {
        exp = exp.expression;
    }
    return exp;
}

export function getObjectFromType(checker: ts.TypeChecker, t: ts.Type, argNum: number): Record<string, ts.Type> {
    const res = {};
    const arg = t.aliasTypeArguments?.[argNum];
    if (!arg) return {};
    for (const prop of arg.getProperties()) {
        //@ts-expect-error Internal APIs
        res[prop.name] = checker.getTypeOfSymbol(prop);
    }
    return res;
}

export function createListOfStr(strings: Array<string>): string {
    if (strings.length === 1) return strings[0] + ".";
    const clone = [...strings];
    const last = clone.pop();
    return `${clone.join(", ")} and ${last}.`;
}

export function getApparentType(checker: ts.TypeChecker, t: ts.Type): ts.Type {
    if (t.isStringLiteral()) return checker.getStringType();
    else if (t.isNumberLiteral()) return checker.getNumberType();
    else return t;
}

export function getCallSigFromType(checker: ts.TypeChecker, type: ts.Type): ts.Signature | undefined {
    const sym = type.getSymbol();
    if (!sym || !sym.declarations?.length) return;
    return checker.getSignatureFromDeclaration((sym.declarations[0] as ts.TypeParameterDeclaration).parent as ts.CallSignatureDeclaration);
}

export function getResolvedTypesFromCallSig(checker: ts.TypeChecker, typeParam: ts.Type[], sig: ts.Signature): ts.Type[] {
    if (!sig.mapper) return [];
    const resolvedTypes: ts.Type[] = [];
    let sources, targets;
    if (sig.mapper.kind === ts.TypeMapKind.Simple) {
        sources = [sig.mapper.source];
        targets = [sig.mapper.target];
    } else if (sig.mapper.kind === ts.TypeMapKind.Array && sig.mapper.targets) {
        sources = sig.mapper.sources;
        targets = sig.mapper.targets;
    } else return resolvedTypes;
    // For some reason type parameters declared in class method signatures have a mapper themselves...
    const resolvedSources = sources.map(p => {
        // Type of mapper is ts.TypeMapper
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const param: ts.Type & {mapper?: any} = p;
        if (param.mapper && param.mapper.kind === ts.TypeMapKind.Composite && param.mapper.mapper1.kind === ts.TypeMapKind.Simple) return param.mapper.mapper1.source;
        else return param;
    });

    for (let i = 0; i < typeParam.length; i++) {
        const sourceIndex = resolvedSources.indexOf(typeParam[i] as ts.Type);
        if (sourceIndex !== -1) resolvedTypes.push(getApparentType(checker, targets[sourceIndex] as ts.Type));
    }
    return resolvedTypes;
}

export function resolveResultType(transformer: Transformer, origin: ts.Node, type?: ts.Type): ValidationResultType {
    if (!type) return {throw: "Error"};
    const rawErrors = type.getProperty("__$raw_error") && isTrueType(transformer.checker.getTypeOfSymbol(type.getProperty("__$raw_error") as ts.Symbol));
    if (type.getProperty("__$error_msg")) return {returnErr: true, rawErrors};
    else if (type.getProperty("__$throw_err")) {
        const sym = transformer.checker.getTypeOfSymbol(type.getProperty("__$throw_err") as ts.Symbol).symbol;
        transformer.importSymbol(sym, origin);
        return {
            throw: sym,
            rawErrors
        };
    } else return {return: transformer.typeValueToNode(type), rawErrors};
}

export const enum BindingPatternTypes {
    Object,
    Array
}

export function forEachVar(
    prop: ts.Expression | ts.BindingName | ts.QualifiedName,
    cb: (i: ts.Expression, bindingPatternType?: BindingPatternTypes) => Array<ts.Statement>,
    parentType?: BindingPatternTypes
): Array<ts.Statement> {
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
    } else return cb(prop);
}

export function isInt(str: string | number): boolean {
    return !isNaN(+str);
}

export function isSingleIfStatement(stmt: ts.Statement): stmt is ts.IfStatement {
    return ts.isIfStatement(stmt) && ts.isReturnStatement(stmt.thenStatement) && !stmt.elseStatement;
}

export function doesAlwaysReturn(stmt: ts.Statement): boolean {
    if (ts.isReturnStatement(stmt)) return true;
    else if (ts.isThrowStatement(stmt)) return true;
    else if (ts.isIfStatement(stmt) && stmt.elseStatement) return doesAlwaysReturn(stmt.elseStatement);
    else if (ts.isBlock(stmt)) {
        const last = stmt.statements[stmt.statements.length - 1];
        if (!last) return false;
        return doesAlwaysReturn(last);
    } else return false;
}

export function TransformerError(callSite: ts.Node, msg: string): void {
    TransformerErrorWrapper(callSite.pos, callSite.end - callSite.pos, msg, callSite.getSourceFile());
    process.exit();
}

export function TransformerErrorWrapper(start: number, length: number, msg: string, file: ts.SourceFile): void {
    if (!ts.sys || typeof process !== "object") throw new Error(msg);
    console.error(
        ts.formatDiagnosticsWithColorAndContext(
            [
                {
                    category: ts.DiagnosticCategory.Error,
                    code: 8000,
                    file,
                    start,
                    length,
                    messageText: msg
                }
            ],
            {
                getNewLine: () => "\r\n",
                getCurrentDirectory: ts.sys.getCurrentDirectory,
                getCanonicalFileName: fileName => fileName
            }
        )
    );
}

export function importSymbol(thisSourceFile: ts.SourceFile, symbol: ts.Symbol): [ts.ImportDeclaration, ts.Identifier] | undefined {
    if (!symbol.valueDeclaration) return;
    const originSourceFile = symbol.valueDeclaration.getSourceFile();
    if (originSourceFile === thisSourceFile) return;
    const fileExports = originSourceFile.symbol?.exports;
    if (!fileExports) return;
    const fileName = ts
        .getRelativePathFromFile(thisSourceFile.fileName, originSourceFile.fileName, name => name)
        .replace(".ts", ".js")
        .replace(".mts", ".mjs");
    let clause, specifier;
    const importIdentifier = ts.factory.createIdentifier(symbol.name);
    if (fileExports.get("default" as ts.__String) === symbol) {
        clause = ts.factory.createImportClause(false, importIdentifier, undefined);
        specifier = clause.name!;
    } else {
        clause = ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, importIdentifier)]));
        specifier = (clause.namedBindings as ts.NamedImports).elements[0];
    }
    const statement = ts.factory.createImportDeclaration(undefined, clause, ts.factory.createStringLiteral(fileName), undefined);
    ts.setParentRecursive(statement, false);
    const refIdent = ts.factory.createIdentifier(symbol.name);
    if (specifier) {
        const emitNode = ts.getOrCreateEmitNode(refIdent);
        emitNode.generatedImportReference = specifier as ts.ImportSpecifier;
    }
    return [statement, refIdent];
}

export function genCheckCtx(validator: Validator | ts.Expression): CodeReferenceReplacement {
    if (validator instanceof Validator)
        return {
            $self: validator.expression(),
            $parent: (index?: ts.Expression) => {
                let parentToGet = index && ts.isNumericLiteral(index) ? +index.text : 0;
                let parent = validator.parent;
                while (parent && parentToGet--) parent = parent.parent;
                return parent ? parent.expression() : UNDEFINED;
            }
        };
    return {$self: validator};
}

export function extractReference(exp: ts.Expression, block: Block<unknown>): [ts.Expression, string] {
    if (!ts.isIdentifier(exp) && !ts.isBindingName(exp)) {
        const [decl, ident] = _var("value", exp, ts.NodeFlags.Const);
        block.nodes.push(decl);
        return [ident, ident.text];
    }
    return [exp, exp.text];
}

export function addArticle(msg: string): string {
    const firstLetter = msg[0]!.toLowerCase();
    if (firstLetter === "a" || firstLetter === "e" || firstLetter === "o" || firstLetter === "i" || firstLetter === "u") return `an ${msg}`;
    return `a ${msg}`;
}
