import { Assert, Range, NoCheck } from "../dist/index";

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


function b(obj?: Assert<{a?: number, b: string, c?: Array<string>, d?: NoCheck<[string, number, boolean]>}>, b: Assert<A>, c: Assert<Range<1, 10>>) : number {
    return 1;
}


function c(c?: Assert<Range<1, 10>>) {
    return 1;
}