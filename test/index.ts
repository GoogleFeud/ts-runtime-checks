import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

class C {}

function a(arg: Assert<string | number | Array<string> | Array<number> | "abc" | undefined | { a: number, b?: Array<string>}>) : () => void {
    return (() => {
        return a;
    });
}

//@ts-expect-error Tesitng
a([[1, 2, 3]], [44, [1, 2, 3]]);


function b(obj: Assert<{a?: number, b: string, c?: Array<string>, d?: [string, number, boolean]}>, b: Assert<A>, c: boolean) : number {
    return 1;
}