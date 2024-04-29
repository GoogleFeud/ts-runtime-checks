import {useState} from "react";

export type SplitPaneProps = {
    split: "vertical" | "horizontal";
    defaultSize: number;
    minSize?: number;
    disabled?: boolean;
    children: [React.ReactNode, React.ReactNode];
    secondChildClass?: string;
};

export const SplitPane: React.FC<SplitPaneProps> = ({split, defaultSize, children, disabled, minSize = 10, secondChildClass}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentSize, setCurrentSize] = useState(defaultSize);

    const propToChange = split === "vertical" ? "width" : "height";
    const propToExpand = propToChange === "width" ? "height" : "width";

    const handleMove = (ev: React.MouseEvent) => {
        if (disabled || !isDragging) return;
        const box = (ev.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = ev.clientX - box.left;
        const y = ev.clientY - box.top;
        if (x > box.right || y > box.bottom) return;

        const target = split === "vertical" ? x : y;
        const maxSize = split === "vertical" ? box.width : box.height;

        setCurrentSize(Math.max((target / maxSize) * 100, minSize));
    };

    const handleDown = () => setIsDragging(true);
    const handleUp = () => setIsDragging(false);

    return (
        <div className={`${split === "vertical" ? "flex-row" : "flex-col"} flex overflow-hidden w-full h-full flex-nowrap`} onMouseUp={handleUp} onMouseMove={handleMove}>
            <div
                style={{
                    [propToChange]: `${currentSize}%`,
                    [propToExpand]: "100%"
                }}>
                {children[0]}
            </div>
            <div className="Resizer cursor-col-resize flex-shrink-0" style={{[propToExpand]: "100%", [propToChange]: "8px"}} onMouseDown={handleDown} />
            <div
                className={secondChildClass}
                style={{
                    [propToChange]: `${100 - currentSize}%`,
                    [propToExpand]: "100%",
                    zIndex: "10"
                }}>
                {children[1]}
            </div>
        </div>
    );
};
