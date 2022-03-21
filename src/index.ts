import ts from "typescript";
import { Transformer } from "./transformer";

export default (program: ts.Program): ts.TransformerFactory<ts.Node> => () => {
    const transformer = new Transformer(program);
    return firstNode => {
        return transformer.run(firstNode as ts.SourceFile);
    };
};

export type Assert<T> = T | T & { __marker: "assert" };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type OrReturn<T, _ReturnValue> = T | T & { __marker: "or-return" }; 