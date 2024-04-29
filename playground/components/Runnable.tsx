import {SplitPane} from "./shared/SplitPane";
import styles from "../css/formatting.module.css";
import {useEffect, useRef, useState} from "react";
import Editor from "@monaco-editor/react";
import beautify from "js-beautify";
import {FormatCode} from "./shared/FormatCode";

export enum LogKind {
    Log,
    Error,
    Warn
}

export interface Log {
    kind: LogKind;
    message: unknown;
}

function resolveLogKind(kind: LogKind): JSX.Element {
    switch (kind) {
        case LogKind.Log:
            return (
                <span className={styles.code}>
                    [<span style={{color: "#236cfc", fontWeight: "bold"}}>LOG</span>]:
                </span>
            );
        case LogKind.Error:
            return (
                <span className={styles.code}>
                    [<span style={{color: "#961a1a", fontWeight: "bold"}}>ERR</span>]:
                </span>
            );
        case LogKind.Warn:
            return (
                <span className={styles.code}>
                    [<span style={{color: "orange", fontWeight: "bold"}}>WARN</span>]:
                </span>
            );
    }
}

export function Runnable(props: {code: string}) {
    const [logs, setLogs] = useState<Log[]>([]);
    const bottomPaneRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        const el = bottomPaneRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const specialConsole = {
        log: (...messages: unknown[]) => {
            setLogs(prev => [...prev, ...messages.map(msg => ({kind: LogKind.Log, message: msg}))]);
        },
        warn: (...messages: unknown[]) => {
            setLogs(prev => [...prev, ...messages.map(msg => ({kind: LogKind.Warn, message: msg}))]);
        },
        error: (...messages: unknown[]) => {
            setLogs(prev => [...prev, ...messages.map(msg => ({kind: LogKind.Error, message: msg}))]);
        }
    };

    return (
        <SplitPane split="horizontal" defaultSize={70} secondChildClass="overflow-auto">
            <div>
                <Editor height="calc(90vh - 50px)" language="javascript" theme="vs-dark" value={beautify(props.code)} options={{readOnly: true}} />;
            </div>
            <div className="bg-[#1e1e1e] text-white h-fit pl-4">
                <div className="flex flex-row gap-4 py-2 sticky top-0 bg-[#1e1e1e]">
                    <button
                        className="p-1 border-2 text-sm rounded-sm border-white"
                        onClick={() => {
                            try {
                                const fn = new Function("console", props.code);
                                fn(specialConsole);
                            } catch (err) {
                                if (err instanceof Error) specialConsole.error(err.message);
                            }
                        }}>
                        Run
                    </button>
                    <button className="p-1 border-2 text-sm rounded-sm border-white" onClick={() => setLogs([])}>
                        Clear
                    </button>
                </div>
                <br />
                <div className="pb-1" ref={bottomPaneRef}>
                    {logs.map((log, index) => (
                        <div key={index}>
                            {!!index && <div className={styles.logSeparator}></div>}
                            {resolveLogKind(log.kind)} <FormatCode value={log.message} />
                        </div>
                    ))}
                </div>
            </div>
        </SplitPane>
    );
}
