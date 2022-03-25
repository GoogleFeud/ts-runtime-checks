import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("number", () => {
    describe("Assert", () => {
        function test(a: Assert<number>) {
            return a;
        }

        describe("In function parameters", () => {
            it("Throw when a number is not provided", () => {
                expect(call(test, "abc")).to.throw("Expected a to be number.");
                expect(call(test)).to.throw("Expected a to be number.");
            });
    
            it("Not throw when a number is provided", () => {
                expect(test(123)).to.be.equal(123);
            });
        });

    });
});