import {createUnplugin} from "unplugin";
import {unpluginFactory} from "./factory";

const unplugin = createUnplugin(unpluginFactory);

export default unplugin;
export const rollup = unplugin.rollup;
export const vite = unplugin.vite;
export const webpack = unplugin.webpack;
export const esbuild = unplugin.esbuild;
export const rspack = unplugin.rspack;
export const farm = unplugin.farm;