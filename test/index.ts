import { Assert, Range, NoCheck, Matches, ExactProps } from "../dist/index";

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


function test(abc: Assert<Matches<"/abc/">>, dd: Assert<() => void>, rere: Assert<C>, rerere: Assert<number>, bb: Assert<ExactProps<{ a: number } & { b: string }>>) {
   // Your code...
}

test("abcde", () => 123, new C(), 333, {a: 12, b: 44});

function test2(prop: Assert<ExactProps<{ a: number, b: string }>>) {
    // Your code ...
}