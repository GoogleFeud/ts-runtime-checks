import type { EarlyReturn, Expr, ErrorMsg } from "../../dist/index";
import { call } from "../utils";
import { expect } from "chai";

describe("Early return", () => {
    
    function test(a: EarlyReturn<string>, b: EarlyReturn<number>) : boolean | undefined {
        return true;
    }

    it("Return undefined when a parameter type is wrong", () => {
        expect(call(test, "Hello", "World")()).to.be.equal(undefined);
        expect(test("Hello", 123)).to.be.equal(true);
    });

    function test2(a: EarlyReturn<{a: number, b: string}, Expr<"a.a === undefined ? \"a\" : \"b\"">>) {
        return "c";
    }

    it("Return the custom return value", () => {
        expect(call(test2, {b: "abc"})()).to.be.equal("a");
        expect(call(test2, {b: "abc", a: 123})()).to.be.equal("c");
    });

    function test3(a: EarlyReturn<{a: [string, number, {b: number}?]}, ErrorMsg>) {
        return true;
    }

    it("Return the error message if specified", () => {
        expect(call(test3, {a: ["Hello", "World"]})()).to.be.equal("Expected a.a[1] to be a number");
        expect(call(test3, {a: ["Hello", 123, { b: "World"}]})()).to.be.equal("Expected a.a[2].b to be a number");
    });

});