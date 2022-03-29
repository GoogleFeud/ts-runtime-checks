import { useMonaco } from "@monaco-editor/react";
import { CSSProperties, useEffect, useState } from "react";

export function Highlight(props: { text: string, style?: CSSProperties }) {
    const [highlighted, setHighlighted] = useState<string>();
    const monaco = useMonaco();

    useEffect(() => {
        if (!monaco) return;

        (async () => {
            const colorized = await monaco.editor.colorize(props.text, "javascript", { tabSize: 4 });
            setHighlighted(colorized);
        })();
    }, [monaco, props.text]);

    return <div>
        {highlighted && <div dangerouslySetInnerHTML={{__html: highlighted}} style={{backgroundColor: "#3c3c3c", ...(props.style || {})}}></div>}
    </div>;
}