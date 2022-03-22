import ts from "typescript";
import { Transformer } from "./transformer";

export default (program: ts.Program): ts.TransformerFactory<ts.Node> => ctx => {
    const transformer = new Transformer(program, ctx);
    return firstNode => {
        return transformer.run(firstNode as ts.SourceFile);
    };
};

//@ts-expect-error Unused ErrorType
//eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Assert<T, ErrorType = Error> = T | T & { __marker: "assert" };
//@ts-expect-error Unused ReturnValue
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type OrReturn<T, ReturnValue> = T | T & { __marker: "or-return" }; 