"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Infer", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (typeof a !== "string" && typeof a !== "number")
                return false;
            if (typeof b !== "object" || b === null || typeof b.a !== "number" || b.b !== false && b.b !== true && typeof b.b !== "number")
                return false;
            return true;
        }
        it("Return true", () => {
            (0, chai_1.expect)(test("abc", {
                a: 123,
                b: 456
            })).to.be.equal(true);
        });
        it("Return false", () => {
            (0, chai_1.expect)(test(123, {
                a: "abc",
                b: false
            })).to.be.equal(false);
        });
    });
});
