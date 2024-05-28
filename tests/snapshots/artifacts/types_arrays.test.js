"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Array", () => {
    describe("Assert", () => {
        function test(a) {
            if (!Array.isArray(a))
                throw new Error("Expected a to be an array<number>");
            for (let i_1 = 0; i_1 < a.length; i_1++) {
                if (typeof a[i_1] !== "number")
                    throw new Error("Expected a[" + i_1 + "] to be a number");
            }
            return a;
        }
        it("Throw when one of the values is not of the type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3, 4, 5, "x"])).to.throw("Expected a[5] to be a number");
        });
        it("Not throw when all of the values are of the same type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3, 4, 5])).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, [])).to.not.throw();
        });
    });
});
