import {TsRuntimeChecksConfig} from "../index";
import {Transformer} from "../transformer";
import ts from "typescript";

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
    private previousTransformer?: Transformer;
    constructor(
        public config: ConfigInfo,
        public tsrsConfig: TsRuntimeChecksConfig,
        public watcher: WatcherProgram
    ) {}

    finish() {
        this.watcher.close();
    }

    /**
     * An "emitFile" callback is needed for when we need to update a file
     * as a consequence.
     *
     * _emitFile: EmitFileFn
     */
    transform(fileName: string, currentContent: string, emitJs?: boolean): string {
        const program = this.watcher.getProgram();
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return currentContent;
        const currentProgram = program.getProgram();
        const transContext = { factory: ts.factory } as ts.TransformationContext;
        let transformer;
        if (this.previousTransformer) transformer = this.previousTransformer.extend(currentProgram, transContext);
        else transformer = new Transformer(currentProgram, transContext, this.tsrsConfig);
        this.previousTransformer = transformer;

        const transformedSource = transformer.run(sourceFile);

        if (emitJs) {
            let output = currentContent;
            program.emit(transformedSource, (_, content) => (output = content));
            return output;
        }

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
        const host = ts.createWatchCompilerHost(config.fileNames, config.options, ts.sys, ts.createSemanticDiagnosticsBuilderProgram, this.diagnosticReporter);
        return host;
    }

    static createWatcher(host: WatcherHost): WatcherProgram {
        const programWatcher = ts.createWatchProgram(host);
        return programWatcher;
    }

    static printer = ts.createPrinter();
    static diagnosticReporter = ts.createDiagnosticReporter(ts.sys, true);
}
