import type { NumRange } from "../../dist/index";
import { expect } from "chai";

// Only way to test it :/
declare function is<T, _M = { __marker: "is" }>(prop: unknown) : prop is T;

describe("Is function", () => {
    
    it("Return false when the value does not match the type", () => {
        expect(is<string>(123)).to.be.equal(false);
        expect(is<{a: number, b: string}>({a: "Hello", b: 3.14})).to.be.equal(false);
        expect(is<NumRange<1, 100> | string>(-1)).to.be.equal(false);
    });

    it("Return true when the value matches the type", () => {
        expect(is<boolean>(true)).to.be.equal(true);
        expect(is<[string, number]>(["a", 123])).to.be.equal(true);
        expect(is<string | { a: number }>({a: "Hello"})).to.equal(true);
    });

});