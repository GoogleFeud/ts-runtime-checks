import ts from "typescript";
import { Transformer } from "./transformer";

export default (program: ts.Program): ts.TransformerFactory<ts.Node> => () => {
    const transformer = new Transformer(program);
    return firstNode => {
        return transformer.run(firstNode as ts.SourceFile);
    };
};