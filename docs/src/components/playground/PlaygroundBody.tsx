import {Runnable} from "../shared/Runnable";
import {useState, useEffect} from "react";
import {genTranspile} from "../../utils/transpile";
import {TextEditor} from "../shared/Editor";
import {SplitPane} from "../shared/SplitPane";
import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";

const SetupCode = `
// Interactive playground! Write in your code and see it getting transpiled on the left!
interface User {
    name: string,
    id: number & Min<10>
}

function validate(user: Assert<User>) {
    // Your code...
}

validate({ name: "abc", id: 4 });
`;

let TRANSPILE: ReturnType<typeof genTranspile>;

export type PlaygroundBodyProps = {
    libCode: string;
};

export const PlaygroundBody: React.FC<PlaygroundBodyProps> = ({libCode}) => {
    if (!TRANSPILE) {
        TRANSPILE = genTranspile(libCode);
    }

    const [code, setCode] = useState<string | undefined>(SetupCode);
    const [compiledCode, setCompiled] = useState<string>("");

    useEffect(() => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        if (params.code) {
            const normalized = decompressFromEncodedURIComponent(params.code);
            if (!normalized) return;
            setCode(normalized);
            const {code, error} = TRANSPILE(normalized);
            setCompiled(code ? code : "" + error);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            setCompiled(TRANSPILE(SetupCode).code!);
        }
    }, []);

    const handleEditorChange = (code: string | undefined) => {
        setCode(code);
        const {code: transpiled, error} = TRANSPILE(code || "");
        setCompiled(transpiled ? transpiled : "" + error);
        if (code) window.history.pushState(undefined, "", `?code=${compressToEncodedURIComponent(code)}`);
    };

    return (
        <SplitPane split="vertical" defaultSize={50}>
            <TextEditor code={code} onChange={handleEditorChange} />
            <Runnable code={compiledCode} />
        </SplitPane>
    );
};
