import ts from "typescript";
import { Transformer } from "./transformer";

export default (program: ts.Program): ts.TransformerFactory<ts.Node> => ctx => {
    const transformer = new Transformer(program, ctx);
    return firstNode => {
        return transformer.run(firstNode as ts.SourceFile);
    };
};

export * from "./markers";