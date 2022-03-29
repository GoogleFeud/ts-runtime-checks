
import { transpile } from "../utils/transpile";
import { useState } from "react";
import { TextEditor } from "../components/Editor";

export default () => {
    const [code, setCode] = useState<string>();
    const [compiledCode, setCompiled] = useState<string>();

    return (
        <div>
            <TextEditor code={code} onChange={(code) => {
                const transpiled = transpile(code || "");
                setCode(code);
                setCompiled(transpiled);
            }} />
            <div style={{ position: "absolute", top: "15px", left: "55%"  }}>
                 Compiled JS:
                <br />
                <br />
                {compiledCode}
            </div>
        </div>
    );
};