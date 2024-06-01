import {SplitPane} from "./SplitPane";
import styles from "../../styles/formatting.module.css";
import {useEffect, useRef, useState} from "react";
import Editor from "@monaco-editor/react";
import beautify from "js-beautify";
import {FormatCode} from "./FormatCode";

export const enum LogKind {
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

export type RunnableProps = {
    code: string;
};

export const Runnable: React.FC<RunnableProps> = ({code}) => {
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
                <Editor height="calc(90vh - 50px)" language="javascript" theme="vs-dark" value={beautify(code)} options={{readOnly: true, minimap: { enabled: false }}} />;
            </div>
            <div className="bg-[#1e1e1e] text-white h-full pl-4">
                <div className="flex flex-row gap-4 py-2 sticky top-0 bg-[#1e1e1e]">
                    <button
                        className="hover:text-gray-400 transition-colors"
                        onClick={() => {
                            try {
                                const fn = new Function("console", code);
                                fn(specialConsole);
                            } catch (err) {
                                if (err instanceof Error) specialConsole.error(err.message);
                            }
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                        </svg>
                    </button>
                    <button className="hover:text-gray-400 transition-colors" onClick={() => setLogs([])}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                        </svg>
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
};
