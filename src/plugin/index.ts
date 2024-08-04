import {TsRuntimeChecksConfig} from "../index";
import {Transformer} from "../transformer";
import ts, {TransformationContext} from "typescript";

export type ProgramType = ts.SemanticDiagnosticsBuilderProgram;
export type WatcherHost = ts.WatchCompilerHostOfFilesAndCompilerOptions<ProgramType>;
export type WatcherProgram = ts.WatchOfFilesAndCompilerOptions<ProgramType>;
export type ConfigInfo = [fileName: string, config: ts.ParsedCommandLine];
export type EmitFileFn = (fileName: string, content: string) => void;

export class PluginContext {
    /**
     * We need to know which files a file depends on for types.
     * If file A contains a type which file B uses for assertions,
     * and suddenly file A changes, we'll need to update file B as well.
     *
     * If file B creates a type that uses file A's type, and file C uses
     * file B's type, and file A's type updates,
     */
    //private relationsBetweenFiles: Map<string, string[]>;
    private tsconfig: ts.ParsedCommandLine;
    private previousTransformer?: Transformer;
    private transformers: ts.TransformerFactory<ts.SourceFile | ts.Bundle>[];
    constructor(
        config: ConfigInfo,
        public tsrsConfig: TsRuntimeChecksConfig,
        public watcher: WatcherProgram
    ) {
        this.tsconfig = config[1];
        this.tsconfig.options.sourceMap = true;
        this.tsconfig.options.inlineSources = true;
        const transformerFactory: (ctx: TransformationContext) => (file: ts.SourceFile) => (ts.SourceFile) = ctx => {
            const program = this.watcher.getProgram().getProgram();
            let transformer: Transformer;
            if (this.previousTransformer) transformer = this.previousTransformer.extend(program, ctx);
            else transformer = new Transformer(program, ctx, this.tsrsConfig);
            this.previousTransformer = transformer;
            return file => transformer.run(file);
        };
        //this.transformers = [transformerFactory, ts.transformESNext as unknown as (ctx: TransformationContext) => (file: ts.SourceFile) => ts.SourceFile];
        this.transformers = [
            ...ts.getTransformers(
                this.tsconfig.options,
                {
                    before: [transformerFactory]
                },
                ts.EmitOnly.Js
            ).scriptTransformers
        ];
        console.log(this.transformers);
    }

    finish() {
        this.watcher.close();
    }

    shouldTransform(fileName: string): boolean {
        return this.tsconfig.fileNames.includes(fileName);
    }

    /**
     * An "emitFile" callback is needed for when we need to update a file
     * as a consequence.
     *
     * _emitFile: EmitFileFn
     */
    transform(fileName: string): string | undefined {
        const program = this.watcher.getProgram();
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return;
        const transformResult = ts.transform(sourceFile, this.transformers, this.tsconfig.options);
        const transformedSource = transformResult.transformed[0];
        if (!transformedSource || ts.isBundle(transformedSource)) return;
        // TODO: Do something with diagnostics?
        return PluginContext.printer.printFile(transformedSource);
    }

    static createContext(tsrcConfig: TsRuntimeChecksConfig = {}): PluginContext | undefined {
        const config = this.findConfig(process.cwd());
        if (!config) return;
        const host = this.createWatchHost(config[1]);
        const watcher = this.createWatcher(host);
        return new PluginContext(config, tsrcConfig, watcher);
    }

    static findConfig(basePath: string): ConfigInfo | undefined {
        const configPath = ts.findConfigFile(basePath, ts.sys.fileExists, "tsconfig.json");
        if (!configPath) return;
        const parsed = ts.parseConfigFileWithSystem(configPath, {}, undefined, undefined, ts.sys, this.diagnosticReporter);
        if (!parsed) return;
        return [configPath, parsed];
    }

    static createWatchHost(config: ts.ParsedCommandLine): WatcherHost {
        const system = {...ts.sys};
        system.write = _ => {
            _;
        };
        system.clearScreen = () => {
            void 0;
        };
        system.writeFile = _ => {
            _;
        };
        const host = ts.createWatchCompilerHost(config.fileNames, config.options, system, ts.createSemanticDiagnosticsBuilderProgram, this.diagnosticReporter);
        return host;
    }

    static createWatcher(host: WatcherHost): WatcherProgram {
        const programWatcher = ts.createWatchProgram(host);
        return programWatcher;
    }

    static printer = ts.createPrinter();
    static diagnosticReporter = ts.createDiagnosticReporter(ts.sys, true);
}
