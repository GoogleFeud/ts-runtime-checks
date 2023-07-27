
import ts from "typescript";
import TsChecks from "../../dist/index";

export const Markers = `
type Assert<T, ReturnValue = ThrowError<Error>> = T & { __marker?: Assert<T, ReturnValue> };
type ErrorMsg<_rawErrorData = false> = { __error_msg: true, __raw_error: _rawErrorData };
type ThrowError<ErrorType = Error, _rawErrorData = false> = { __throw_err: ErrorType, __raw_error: _rawErrorData };
interface ValidationError {
    valueName: string,
    value: unknown,
    parts: string[]
};
type NoCheck<T> = T & { __utility?: NoCheck<T> };
type ExactProps<Obj extends object, removeExcessive = false, useDeleteOperator = false> = Obj & { __utility?: ExactProps<Obj, removeExcessive, useDeleteOperator> };
type Expr<Expression extends string> = { __utility?: Expr<Expression> };
type If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };
type Check<T extends string, E extends string = never, N extends string = never, V extends string|number = never> = unknown & { __check?: T, __error?: E, __utility?: Check<T, E, N, V> };
type Min<T extends string | number> = Check<\`$self > \${T}\`, \`to be greater than \${T}\`, "min", T>;
type Max<T extends string | number> = Check<\`$self < \${T}\`, \`to be less than \${T}\`, "max", T>;
type Float = Check<"$self % 1 !== 0", "to be a float", "float">;
type Int = Check<"$self % 1 === 0", "to be an int", "int">;
type MinLen<T extends string | number> = Check<\`$self.length > \${T}\`, \`to have a length greater than \${T}\`, "minLen", T>;
type MaxLen<T extends string | number> = Check<\`$self.length < \${T}\`, \`to have a length less than \${T}\`, "maxLen", T>;
type Length<T extends string | number> = Check<\`$self.length === \${T}\`, \`to have a length equal to \${T}\`, "length", T>;
type Matches<T extends string> = Check<\`\${T}.test($self)\`, \`to match \${T}\`, "matches", T>;
type Not<T extends Check<string, string>> = Check<\`!(\${T["__check"]})\`, \`not \${T["__error"]}\`>;
type Or<L extends Check<string, string>, R extends Check<string, string>> = Check<\`\${L["__check"]} || \${R["__check"]}\`, \`\${L["__error"]} or \${R["__error"]}\`>;
type Infer<Type> = Type & { __utility?: Infer<Type> };
type Resolve<Type, ReturnValue = ThrowError<Error>> = Type & { __utility?: Resolve<Type, ReturnValue> };
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
                else if (fileName === "module.ts") return SourceFile;
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
        try {
            program.emit(undefined, undefined, undefined, undefined, { before: [ TsChecks(program) as unknown as ts.TransformerFactory<ts.SourceFile> ]});
        } catch (err: unknown) {
            return { error: err };
        }
        return { code: output };
    };
}