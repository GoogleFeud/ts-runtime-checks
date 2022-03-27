import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Unions", () => {
    describe("Assert", () => {
        function test(a: Assert<string|number|[string|number, string]>) {
            return a;
        }

        it("Throw when a different type is provided", () => {
            expect(call(test, true)).to.throw("Expected a to be string | number | [string | number, string].");
            expect(call(test, test)).to.throw("Expected a to be string | number | [string | number, string].");
            expect(call(test, {})).to.throw("Expected a to be string | number | [string | number, string].");
        });
    
        it("Not throw when a value of the right type is provided", () => {
            expect(call(test, "Hello")).to.not.throw();
            expect(call(test, [33, "World"])).to.not.throw();
            expect(call(test, 12)).to.not.throw();
        });

    });

});