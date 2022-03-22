import { Assert } from "../dist/index";

interface A {
    a: number,
    b: string
}

function a(a: Assert<A>) : () => void {
    return (() => {
        if (a.a === 1) {
            return a.a as number;
        }
        a.a as number;
        return a.a as number;
    });
}