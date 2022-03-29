
import { transpile } from "../utils/transpile";
import { useState } from "react";
import { TextEditor } from "../components/Editor";
import { Highlight } from "../components/Highlight";
import SplitPane from "react-split-pane";

export default () => {
    const [code, setCode] = useState<string>();
    const [compiledCode, setCompiled] = useState<string>("");

    return (
        <SplitPane split="vertical" defaultSize={"50%"} primary="first">
            <TextEditor code={code} onChange={(code) => {
                const transpiled = transpile(code || "");
                setCode(code);
                setCompiled(transpiled);
            }} />
            <div>
                <Highlight text={compiledCode} style={{height: "90vh"}} />
            </div>
        </SplitPane>
    );
};