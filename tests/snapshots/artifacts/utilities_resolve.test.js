"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Resolve", () => {
    describe("Assert", () => {
        function test(a, b) {
            return true;
        }
        it("Return true", () => {
            (0, chai_1.expect)((() => {
                const a = "abc";
                const b = {
                    a: 123,
                    b: 456
                };
                if (typeof a !== "string")
                    return false;
                if (typeof b !== "object" || b === null || typeof b.b !== "number" || typeof b.a !== "number")
                    return false;
                return test(a, b);
            })()).to.be.equal(true);
        });
        it("Return false", () => {
            (0, chai_1.expect)((() => {
                const a = "abc";
                const b = {
                    a: "abc",
                    b: 456
                };
                if (typeof a !== "string")
                    return false;
                if (typeof b !== "object" || b === null || typeof b.b !== "number" || typeof b.a !== "number")
                    return false;
                return test(a, b);
            })()).to.be.equal(false);
        });
    });
});
