
import ts from "typescript";
import TsChecks from "../../dist/index";

export const Markers = `
export type Assert<T, ErrorType = Error> = T & { __marker?: Assert<T, ErrorType> };
export type EarlyReturn<T, ReturnValue = undefined> = T & { __marker?: EarlyReturn<T, ReturnValue> };
export type Range<min extends number|Expr<"">, max extends number|Expr<"">> = number & { __utility?: Range<min, max> }; 
export type NoCheck<T> = T & { __utility?: NoCheck<T> };
export type Matches<Regex extends string|Expr<"">> = string & { __utility?: Matches<Regex> };
export type ExactProps<Obj extends object> = Obj & { __utility?: ExactProps<Obj> };
export type Expr<Expression extends string> = { __utility?: Expr<Expression> };
export type If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };

`;

export const CompilerOptions: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    strict: true,                       
    noImplicitAny: true,                          
    strictNullChecks: true,
    target: ts.ScriptTarget.ESNext     
};

export function transpile(str: string) {
    const SourceFile = ts.createSourceFile("module.ts", Markers + str, CompilerOptions.target || ts.ScriptTarget.ESNext, true);
    let output = "";
    const CompilerHost: ts.CompilerHost = {
        getSourceFile: () => SourceFile,
        writeFile: (_name, text) => output = text,
        getDefaultLibFileName: () => "",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => "\n",
        fileExists: () => true,
        readFile: () => "",
        directoryExists: () => true,
        getDirectories: () => []
    };

    const program = ts.createProgram(["module.ts"], CompilerOptions, CompilerHost);
    program.emit(undefined, undefined, undefined, undefined, { before: [ TsChecks(program) as unknown as ts.TransformerFactory<ts.SourceFile> ]});
    return output;
}