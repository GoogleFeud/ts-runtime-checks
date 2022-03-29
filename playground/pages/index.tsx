import Editor from "@monaco-editor/react";
import { transpile } from "../utils/transpile";
import { useState } from "react";

export default () => {
    const [code, setCode] = useState<string>();
    const [compiledCode, setCompiled] = useState<string>();

    return (
        <div>
            <Editor height="100vh" width="45%" language="typescript" theme="vs-dark" value={code} onChange={(code) => {
                const transpiled = transpile(code || "");
                setCode(code);
                setCompiled(transpiled);
            } }>
            </Editor>
            <div style={{ position: "absolute", top: "15px", left: "45%"  }}>
          Compiled JS:
                {compiledCode}
            </div>
        </div>
    );
};