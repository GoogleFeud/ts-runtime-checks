
import ts from "typescript";
import TsChecks from "../../dist/index";

export const Markers = `
type Assert<T, ErrorType = Error> = T & { __marker?: Assert<T, ErrorType> };
type EarlyReturn<T, ReturnValue = undefined> = T & { __marker?: EarlyReturn<T, ReturnValue> };
type ErrorMsg = { __error_msg: true };
type Num<Settings extends {
    min?: number|Expr<"">,
    max?: number|Expr<"">,
    type?: "int" | "float"
}> = number & { __utility?: Num<Settings> };
type NoCheck<T> = T & { __utility?: NoCheck<T> };
type Str<Settings extends {
    length?: number|Expr<"">,
    minLen?: number|Expr<"">,
    maxLen?: number|Expr<"">,
    matches?: string|Expr<"">
}> = string & { __utility?: Str<Settings> };
type Arr<T, Settings extends {
    length?: number|Expr<"">,
    minLen?: number|Expr<"">,
    maxLen?: number|Expr<"">
}> = Array<T> & { __utility?: Arr<T, Settings> };
type ExactProps<Obj extends object, removeExcessive extends boolean = false> = Obj & { __utility?: ExactProps<Obj, removeExcessive> };
type Expr<Expression extends string> = { __utility?: Expr<Expression> };
type If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };
declare function is<T, _M = { __marker: "is" }>(prop: unknown) : prop is T;
declare function check<T, _M = { __marker: "check" }>(prop: unknown) : [T, Array<string>];

`;

export const CompilerOptions: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),                    
    noImplicitAny: true,                          
    strictNullChecks: true,
    target: ts.ScriptTarget.ESNext     
};

export function genTranspile(lib: string) : (str: string) => { code?: string, error?: unknown} {
    const LibFile = ts.createSourceFile("lib.d.ts", lib + Markers, CompilerOptions.target || ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    return (str) => {
        const SourceFile = ts.createSourceFile("module.ts", str, CompilerOptions.target || ts.ScriptTarget.ESNext, true);
        let output = "";
        const CompilerHost: ts.CompilerHost = {
            getSourceFile: (fileName) => {
                if (fileName.endsWith(".d.ts")) return LibFile;
                return SourceFile;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            useCaseSensitiveFileNames: () => false,
            writeFile: (_name, text) => output = text,
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => "",
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => []
        };
    
        const program = ts.createProgram(["module.ts"], CompilerOptions, CompilerHost);
        //@ts-expect-error Set globals
        window.checker = program.getTypeChecker();
        //@ts-expect-error Set globals
        window.source = SourceFile;
        try {
            program.emit(undefined, undefined, undefined, undefined, { before: [ TsChecks(program) as unknown as ts.TransformerFactory<ts.SourceFile> ]});
        } catch (err: unknown) {
            return { error: err };
        }
        return { code: output };
    };
}