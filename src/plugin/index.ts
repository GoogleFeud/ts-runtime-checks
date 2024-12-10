import {TsRuntimeChecksConfig} from "../index";
import {Transformer} from "../transformer";
import ts from "typescript";

export type ProgramType = ts.EmitAndSemanticDiagnosticsBuilderProgram;
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
    private transformerFactory: (ctx: ts.TransformationContext) => (file: ts.SourceFile) => ts.SourceFile;
    constructor(
        config: ConfigInfo,
        public tsrsConfig: TsRuntimeChecksConfig,
        public watcher: WatcherProgram
    ) {
        this.tsconfig = config[1];
        this.tsconfig.options.sourceMap = true;
        this.tsconfig.options.inlineSources = true;
        this.tsconfig.options.noEmit = false;
        this.tsconfig.options.noEmitOnError = false;
        this.tsconfig.options.jsx = ts.JsxEmit.React;
        this.transformerFactory = ctx => {
            const program = this.watcher.getProgram().getProgram();
            let transformer: Transformer;
            if (this.previousTransformer) transformer = this.previousTransformer.extend(program, ctx);
            else transformer = new Transformer(program, ctx, this.tsrsConfig);
            this.previousTransformer = transformer;
            return file => transformer.run(file);
        };
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
    transform(fileName: string): Promise<string | undefined> {
        return new Promise(resolve => {
            const program = this.watcher.getProgram();
            const sourceFile = program.getSourceFile(fileName);
            if (!sourceFile) return;
            program.getProgram().emit(
                sourceFile,
                (fileName, content) => {
                    if (fileName.endsWith(".map")) return;
                    resolve(content);
                },
                undefined,
                undefined,
                {
                    before: [this.transformerFactory]
                }
            );
        });
        // TODO: Do something with diagnostics?
        // const transformResult = ts.transform(sourceFile, [this.transformerFactory], this.tsconfig.options);
        // const transformedSource = transformResult.transformed[0];
        // if (!transformedSource) return;
        // return PluginContext.printer.printFile(transformedSource);
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
        system.writeFile = path => {
            console.log(path);
        };
        const host = ts.createWatchCompilerHost(config.fileNames, config.options, system, ts.createEmitAndSemanticDiagnosticsBuilderProgram, this.diagnosticReporter);
        return host;
    }

    static createWatcher(host: WatcherHost): WatcherProgram {
        const programWatcher = ts.createWatchProgram(host);
        return programWatcher;
    }

    static printer = ts.createPrinter();
    static diagnosticReporter = ts.createDiagnosticReporter(ts.sys, true);
}
