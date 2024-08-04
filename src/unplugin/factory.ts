import {type UnpluginFactory} from "unplugin";
import {TsRuntimeChecksConfig} from "../index";
import {PluginContext} from "../plugin";

let ctx: PluginContext;

export const unpluginFactory: UnpluginFactory<TsRuntimeChecksConfig | undefined> = (options = {}) => {
    return {
        name: "unplugin-ts-runtime-checks",
        buildStart() {
            if (ctx) return;
            ctx = PluginContext.createContext(options)!;
        },
        transformInclude(fileName) {
            // TODO: Allow more
            return fileName.endsWith(".ts") || fileName.endsWith(".tsx");
        },
        transform(code, fileName) {
            const transformed = ctx.transform(fileName);
            console.log("TRANSFORMED: ", fileName, transformed);
            return transformed || code;
        },
        buildEnd() {
            ctx.finish();
        }
    };
};
