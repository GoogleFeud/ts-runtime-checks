"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Check function", () => {
    it("Return the correct value and errors", () => {
        const [, errs] = (() => {
            const temp_1 = {
                a: 123,
                b: 456,
                c: {
                    d: 44
                }
            };
            const result_1 = [];
            if (typeof temp_1 !== "object")
                result_1.push("Expected value to be { a: number; b: string; c: { d: NumRange<1, 10>; }; }.");
            if (typeof temp_1["a"] !== "number")
                result_1.push("Expected value.a to be number.");
            if (typeof temp_1["b"] !== "string")
                result_1.push("Expected value.b to be string.");
            if (typeof temp_1["c"] !== "object")
                result_1.push("Expected value.c to be { d: NumRange<1, 10>; }.");
            if (typeof temp_1["c"]["d"] !== "number" || (temp_1["c"]["d"] < 1 || temp_1["c"]["d"] > 10))
                result_1.push("Expected value.c.d to be more than 1 and less than 10.");
            return [temp_1, result_1];
        })();
        (0, chai_1.expect)(errs[0]).to.be.equal("Expected value.b to be string.");
        (0, chai_1.expect)(errs[1]).to.be.equal("Expected value.c.d to be more than 1 and less than 10.");
    });
});
