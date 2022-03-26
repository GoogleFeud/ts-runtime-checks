import type { Assert, NoCheck } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("NoCheck", () => {
    describe("Assert", () => {
        describe("In function parameters", () => {
            function test(a: Assert<NoCheck<[string, number]>>, b: Assert<string>) {
                return [a, b];
            }

            it("Not throw when a wrong type is provided", () => {
                expect(call(test, 123, "abc")).to.not.throw();
                expect(call(test, [123, "AAA"], "abc")).to.not.throw();
                expect(call(test, undefined, 123)).to.throw("Expected b to be string.");
            });
    
    
        });
    });
});