import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

class C {}

function a(a?: Assert<Array<Array<number>>, TypeError>, b?: Assert<string>) : () => void {
    return (() => {
        return a;
    });
}