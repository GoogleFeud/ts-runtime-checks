import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("string", () => {
    describe("Assert", () => {
        function test(a: Assert<string>) {
            return a;
        }

        function test2(a: Assert<"abc">) {
            return a;
        }

        describe("In function parameters", () => {
            it("Throw when a string is not provided", () => {
                expect(call(test, 12)).to.throw("Expected a to be string.");
                expect(call(test)).to.throw("Expected a to be string.");
            });
    
            it("Not throw when a string is provided", () => {
                expect(call(test, "abc3de3de3")).to.not.throw();
            });

            it("Throw when the string literal is not the same", () => {
                expect(call(test2, "abcd")).to.throw("Expected a to be \"abc\".");
            });

            it("Not throw when the string literal is the same", () => {
                expect(call(test2, "abc")).to.not.throw();
            });
        });

    });
});