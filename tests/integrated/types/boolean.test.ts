import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Boolean", () => {
    describe("Assert", () => {
        function test(a: Assert<boolean>) {
            return a;
        }

        it("Throw when a value is not provided", () => {
            expect(call(test, 12)).to.throw("Expected a to be a boolean");
            expect(call(test)).to.throw("Expected a to be a boolean");
        });
    
        it("Not throw when a boolean is provided", () => {
            expect(call(test, false)).to.not.throw();
            expect(call(test, true)).to.not.throw();
        });

    });
});