"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Check function", () => {
    it("Return the correct value and errors", () => {
        const value_1 = {
            a: 123,
            b: 456,
            c: {
                d: 44
            }
        };
        const errs = [];
        if (typeof value_1 !== "object" || value_1 === null)
            errs.push("Expected value to be object");
        else {
            const { c: c_1 } = value_1;
            if (typeof value_1.a !== "number")
                errs.push("Expected value.a to be a number");
            if (typeof value_1.b !== "string")
                errs.push("Expected value.b to be a string");
            if (typeof c_1 !== "object" || c_1 === null)
                errs.push("Expected value.c to be object");
            else {
                if (typeof c_1.d !== "number" || c_1.d < 1 || c_1.d > 10)
                    errs.push("Expected value.c.d to be a number, to be greater than 1 & to be less than 10");
            }
        }
        (0, chai_1.expect)(errs[0]).to.be.equal("Expected value.b to be a string");
        (0, chai_1.expect)(errs[1]).to.be.equal("Expected value.c.d to be a number, to be greater than 1 & to be less than 10");
    });
});
