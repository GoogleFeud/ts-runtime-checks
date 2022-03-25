import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("number", () => {
    describe("Assert", () => {
        function test(a: Assert<number>) {
            return a;
        }

        function test2(a: Assert<123>) {
            return a;
        }

        describe("In function parameters", () => {
            it("Throw when a number is not provided", () => {
                expect(call(test, "abc")).to.throw("Expected a to be number.");
                expect(call(test)).to.throw("Expected a to be number.");
            });
    
            it("Not throw when a number is provided", () => {
                expect(call(test, 123)).to.not.throw();
            });

            it("Throw when the number literal is not the same", () => {
                expect(call(test2, 1234)).to.throw("Expected a to be 123.");
            });

            it("Not throw when the number literal is the same", () => {
                expect(call(test2, 123)).to.not.throw();
            });

        });

    });
});