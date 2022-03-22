import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

class C {}

function a(a?: Assert<123>) : () => void {
    return (() => {
        return a;
    });
}