import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

class C {}

function a(a?: Assert<Array<Array<number>>, TypeError>, b?: Assert<[number, Array<string>]>) : () => void {
    return (() => {
        return a;
    });
}

//@ts-expect-error Tesitng
a([[1, 2, 3]], [44, [1, 2, 3]]);