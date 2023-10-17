import SplitPane from "react-split-pane";
import styles from "../css/App.module.css";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import beautify from "js-beautify";

export enum LogKind {
    Log,
    Error,
    Warn
}

export interface Log {
    kind: LogKind,
    message: unknown
}

function resolveLogKind(kind: LogKind) : JSX.Element {
    switch (kind) {
    case LogKind.Log: return <span className={styles.code}>[<span style={{ color: "#236cfc", fontWeight: "bold" }}>LOG</span>]:</span>;
    case LogKind.Error: return <span className={styles.code}>[<span style={{ color: "#961a1a", fontWeight: "bold" }}>ERR</span>]:</span>;
    case LogKind.Warn: return <span className={styles.code}>[<span style={{ color: "orange", fontWeight: "bold" }}>WARN</span>]:</span>;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatObjectLike(obj: [string|number|symbol, unknown][], original: any, nestIdent?: number, extraCode?: string) : JSX.Element {
    return <>
        <span className={styles.code}><span className={styles.classNameIdent}>{(original.constructor && original.constructor.name && original.constructor.name !== "Object" && original.constructor.name + " ") || ""}</span>{extraCode || ""}{"{"}
            <br />
            <span>
                {obj.map(([key, val], index) => <span key={index}>
                    {!!index && <><span className={styles.comma}>, </span><br /></>}
                    <span>{"  ".repeat(nestIdent || 2)}{key}: {formatValue(val, (nestIdent || 2) + 1)}</span>
                </span>)}
            </span>
            <br />
            {"  ".repeat(nestIdent ? nestIdent - 1 : 1) + "}"}</span>
    </>;
}

function formatValue(obj: unknown, nestIdent = 0) : JSX.Element {
    if (typeof obj === "string") return <span className={`${styles.code} ${styles.string}`}>"{obj.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}"</span>;
    else if (typeof obj === "number") return <span className={`${styles.code} ${styles.number}`}>{obj}</span>;
    else if (typeof obj === "function") return <span className={styles.code}>[Function]</span>;
    else if (obj === undefined) return <span className={`${styles.code} ${styles.keyword}`}>undefined</span>;
    else if (obj === null) return <span className={`${styles.code} ${styles.keyword}`}>null</span>;
    else if (obj === true) return <span className={`${styles.code} ${styles.keyword}`}>true</span>;
    else if (obj === false) return <span className={`${styles.code} ${styles.keyword}`}>false</span>;
    else if (Array.isArray(obj)) return <span className={styles.code}>[{obj.map((element, index) => <span key={index}>
        {!!index && <span className={styles.comma}>, </span>}
        {formatValue(element, nestIdent + 1)}
    </span>)}]</span>;
    else if (obj instanceof Map) return formatObjectLike([...obj.entries()], obj, nestIdent, `(${obj.size}) `);
    else if (obj instanceof Set) return <span className={styles.code}><span className={styles.classNameIdent}>Set </span>({obj.size}){" {"}{[...obj.values()].map((element, index) => <span key={index}>
        {!!index && <span className={styles.comma}>, </span>}
        {formatValue(element, nestIdent + 1)}
    </span>)}{"}"}</span>; 
    else {
        const entries = Object.entries(obj);
        if (entries.length === 0) return <>{"{}"}</>;
        else return formatObjectLike(entries, obj, nestIdent);
    }
}


export function Runnable(props: { code: string }) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [newHeight, setNewHeight] = useState<string>("100%");
    const topPaneRef = useRef<HTMLDivElement>(null);
    const bottomPaneRef = useRef<HTMLDivElement>(null);

    const recalcHeight = () => {
        const current = topPaneRef.current;
        if (!current) return;
        setNewHeight(`${window.innerHeight - topPaneRef.current.clientHeight - (55 * 3)}px`);
    };

    const scrollToBottom = () => {
        const el = bottomPaneRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    };

    useEffect(() => {
        recalcHeight();
        scrollToBottom();
    }, [logs]);

    const specialConsole = {
        log: (...messages: unknown[]) => {
            setLogs([...logs, ...messages.map(msg => ({ kind: LogKind.Log, message: msg }))]);
        },
        warn: (...messages: unknown[]) => {
            setLogs([...logs, ...messages.map(msg => ({ kind: LogKind.Warn, message: msg }))]);
        },
        error: (...messages: unknown[]) => {
            setLogs([...logs, ...messages.map(msg => ({ kind: LogKind.Error, message: msg }))]);
        },
    };

    return <SplitPane split="horizontal" defaultSize={"70%"} primary="first" onDragFinished={recalcHeight}>
        <div style={{width: "100%"}} ref={topPaneRef}>
            <Editor height={"80vh"} language="javascript" theme="vs-dark" value={beautify(props.code)} options={{readOnly: true}}/>;
        </div>
        <div className={styles.runSection}>
            <button className={styles.button} onClick={() => {
                try {
                    const fn = new Function("console", props.code);
                    fn(specialConsole);
                } catch(err) {
                    if (err instanceof Error) specialConsole.error(err.message);
                }
            }}>Run</button>
            <button className={styles.button} onClick={() => setLogs([])}>Clear</button>
            <br />
            <div className={styles.runSectionResult} style={{height: newHeight}} ref={bottomPaneRef}>
                {logs.map((log, index) => <div key={index}>
                    {!!index && <div className={styles.logSeparator}></div>}
                    {resolveLogKind(log.kind)}{" "}
                    {formatValue(log.message)}
                </div>)}
            </div>
        </div>
    </SplitPane>;
}