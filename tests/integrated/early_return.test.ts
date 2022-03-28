import type { EarlyReturn, Expr } from "../../dist/index";
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

});