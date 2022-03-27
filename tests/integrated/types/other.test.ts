
import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Symbol / Bigint", () => {
    describe("Assert", () => {
        function test(a: Assert<symbol>, b: Assert<bigint>) {
            return [a, b];
        }
        it("Not throw when the right types are provided", () => {
            expect(call(test, Symbol(), 123n)).to.not.throw();
        });

        it("Throw when wrong types are provided", () => {
            expect(call(test, 123, 123n)).to.throw("Expected a to be symbol.");
            expect(call(test, Symbol(), 123)).to.throw("Expected b to be bigint.");
        });

    });
});