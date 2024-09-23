import ts from "typescript";
import {Transformer} from "./transformer";

export interface TsRuntimeChecksConfig {
    jsonSchema?: {
        dist: string;
        types?: string[];
        typePrefix?: string;
    };
    assertAll?: boolean
}

export default (program: ts.Program, config?: TsRuntimeChecksConfig): ts.TransformerFactory<ts.Node> =>
    ctx => {
        const transformer = new Transformer(program, ctx, config || {});
        return firstNode => {
            return transformer.run(firstNode as ts.SourceFile);
        };
    };

export * from "./markers";
