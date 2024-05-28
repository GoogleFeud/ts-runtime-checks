import * as checks from "../../../src/index";
import ts from "typescript";

const TsChecks = checks.default;

export const Markers = `
type Assert<T, Action = ThrowError<Error>> = T & { __$marker?: "Assert", __$marker_params?: [T, Action] };
type ErrorMsg<_rawErrorData = false> = { __$error_msg: true, __$raw_error: _rawErrorData };
type ThrowError<ErrorType = Error, _rawErrorData = false> = { __$throw_err: ErrorType, __$raw_error: _rawErrorData };
interface ValidationError {
    valueName: string,
    value: unknown,
    expectedType: {
        [key: string]: string | number,
        kind: number
    }
};
type NoCheck<T> = T & {  __$name?: "NoCheck" };
type ExactProps<Obj extends object, removeExcessive = false, useDeleteOperator = false> = Obj & { __$type?: Obj, __$removeExcessive?: removeExcessive, __$useDeleteOprerator?: useDeleteOperator, __$name?: "ExactProps" };
type Expr<Expression extends string> = { __$type?: Expression, __$name?: "Expr" };
type Check<Cond extends string | ((value: unknown) => any), Err extends string = never, ID extends string = any, Value extends string | number = any> = unknown & { __$check?: Cond, __$error?: Err, __$value?: Value, __$id?: ID, __$name?: "Check" };
type Min<T extends string | number> = number & Check<\`$self >= \${T}\`, \`to be greater than \${T}\`, "min", T>;
type Max<T extends string | number> = number & Check<\`$self <= \${T}\`, \`to be less than \${T}\`, "max", T>;
type Float = number & Check<"$self % 1 !== 0", "to be a float", "float">;
type Int = number & Check<"$self % 1 === 0", "to be an int", "int">;
type MinLen<T extends string | number> = Check<\`$self.length >= \${T}\`, \`to have a length greater than \${T}\`, "minLen", T>;
type MaxLen<T extends string | number> = Check<\`$self.length <= \${T}\`, \`to have a length less than \${T}\`, "maxLen", T>;
type Length<T extends string | number> = Check<\`$self.length === \${T}\`, \`to have a length equal to \${T}\`, "length", T>;
type Matches<T extends string> = string & Check<\`\${T}.test($self)\`, \`to match \${T}\`, "matches", T>;
type Eq<Expr extends string, T = unknown> = unknown extends T ? Check<\`$self === \${Expr}\`, \`to be equal to \${Expr}\`, "eq", Expr> : NoCheck<T> & Check<\`$self === \${Expr}\`, \`to be equal to \${Expr}\`, "eq", Expr>;
type Not<T extends Check<string, string>> = Check<\`!(\${T["__$check"]})\`, \`not \${T["__$error"]}\`>;
type Infer<Type> = Type & { __$name?: "Infer" };
type Resolve<Type> = Type & { __$name?: "Resolve" };
type Transformation = string | ((value: any) => any);
type Transform<
    Transformations extends Transformation | Transformation[],
    V = Transformations extends [(value: infer R) => unknown, ...unknown[]] ? R : Transformations extends (value: infer R) => unknown ? R : unknown,
    T = Transformations extends [...unknown[], (value: unknown) => infer R] ? R : Transformations extends (value: any) => infer R ? R : unknown
> = V & {__$transform?: T; __$transformations?: Transformations; __$name?: "Transform"};
type Transformed<T> = {
    [Key in keyof T]: T[Key] extends {__$transform?: unknown} ? NonNullable<T[Key]["__$transform"]> : T[Key];
};
type Null = {__$name?: "Null"};
type Undefined = {__$name?: "Undefined"};
declare function is<T, _M = { __$marker: "is" }>(prop: unknown) : prop is T;
declare function check<T, _rawErrorData extends boolean = false, _M = { __$marker: "check" }>(prop: unknown) : [T, Array<_rawErrorData extends true ? ValidationError : string>];
declare function createMatch<R, U = unknown, _M = { __$marker: "createMatch" }>(fns: ((val: any) => R)[], noDiscriminatedObjAssert?: boolean) : (val: U) => R;
declare function transform<T, _Action = unknown, _M = {__$marker: "transform"}>(value: T): Transformed<T>;
`;

export const CompilerOptions: ts.CompilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    noImplicitAny: true,
    strictNullChecks: true,
    target: ts.ScriptTarget.ESNext
};

export function genTranspile(lib: string): (str: string) => {code?: string; error?: unknown} {
    const LibFile = ts.createSourceFile("lib.d.ts", lib + Markers, CompilerOptions.target || ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    return str => {
        const SourceFile = ts.createSourceFile("module.ts", str, CompilerOptions.target || ts.ScriptTarget.ESNext, true);
        let output = "";
        const CompilerHost: ts.CompilerHost = {
            getSourceFile: fileName => {
                if (fileName.endsWith(".d.ts")) return LibFile;
                else if (fileName === "module.ts") return SourceFile;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            useCaseSensitiveFileNames: () => false,
            writeFile: (_name, text) => (output = text),
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
            program.emit(undefined, undefined, undefined, undefined, {before: [TsChecks(program) as unknown as ts.TransformerFactory<ts.SourceFile>]});
        } catch (err: unknown) {
            return {error: err};
        }
        return {code: output};
    };
}
