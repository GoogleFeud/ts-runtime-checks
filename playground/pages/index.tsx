import Editor from "@monaco-editor/react";
import { useState } from "react";

export default () => {
    const [code, setCode] = useState<string>();
  
    return (
        <div>
          Hello World!
            <Editor height="100vh" width="100vw" language="typescript" theme="vs-dark" value={code} onChange={(code) => {
                setCode(code);
            }}>
            </Editor>
        </div>
    );
};