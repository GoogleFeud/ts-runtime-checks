import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

class C {}

function a(arg: Assert<string | number | Array<string> | Array<number> | "abc">) : () => void {
    return (() => {
        return a;
    });
}

//@ts-expect-error Tesitng
a([[1, 2, 3]], [44, [1, 2, 3]]);