
import { transpile } from "../utils/transpile";
import { useState } from "react";
import { TextEditor } from "../components/Editor";
import { Highlight } from "../components/Highlight";

export default () => {
    const [code, setCode] = useState<string>();
    const [compiledCode, setCompiled] = useState<string>("");

    return (
        <div>
            <TextEditor code={code} onChange={(code) => {
                const transpiled = transpile(code || "");
                setCode(code);
                setCompiled(transpiled);
            }} />
            <div style={{ position: "absolute", top: "15px", left: "55%", width: "40%" }}>
                <Highlight text={compiledCode} style={{height: "95vh", width: "100%" }} />
            </div>
        </div>
    );
};