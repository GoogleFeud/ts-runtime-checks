import {type UnpluginFactory} from "unplugin";
import {TsRuntimeChecksConfig} from "../index";
import {PluginContext} from "./core";

export const unpluginFactory: UnpluginFactory<TsRuntimeChecksConfig | undefined> = (options = {}) => {
    const ctx = PluginContext.createContext(options);

    if (!ctx) return {name: "unplugin-ts-runtime-checks"};

    return {
        name: "unplugin-ts-runtime-checks",
        transformInclude(fileName) {
            // TODO: Allow more
            return fileName.endsWith(".ts") || fileName.endsWith(".tsx");
        },
        transform(code, fileName) {
            console.log("TRANSFORMING: ", fileName);
            return ctx.transform(fileName, code);
        },
        buildEnd() {
            ctx.finish();
        },
    };
};
