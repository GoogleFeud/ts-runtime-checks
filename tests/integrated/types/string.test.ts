import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("string", () => {
    describe("Assert", () => {
        function test(a: Assert<string>) {
            return a;
        }

        describe("In function parameters", () => {
            it("Throw when a string is not provided", () => {
                expect(call(test, 12)).to.throw("Expected a to be string.");
                expect(call(test)).to.throw("Expected a to be string.");
            });
    
            it("Not throw when a string is provided", () => {
                expect(test("abc")).to.be.equal("abc");
            });
        });

    });
});