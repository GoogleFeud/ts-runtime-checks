"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Is function", () => {
    it("Return false when the value does not match the type", () => {
        const value_1 = 123;
        (0, chai_1.expect)(typeof value_1 === "string").to.be.equal(false);
        const value_2 = { a: "Hello", b: 3.14 };
        (0, chai_1.expect)(typeof value_2 === "object" && value_2 !== null && typeof value_2.a === "number" && typeof value_2.b === "string").to.be.equal(false);
        const value_3 = -1;
        (0, chai_1.expect)(typeof value_3 === "string" || (typeof value_3 === "number" && value_3 >= 1 && value_3 <= 100)).to.be.equal(false);
    });
    it("Return true when the value matches the type", () => {
        const value_4 = true;
        (0, chai_1.expect)(value_4 === false || value_4 === true).to.be.equal(true);
        const value_5 = ["a", 123];
        (0, chai_1.expect)(Array.isArray(value_5) && typeof value_5[0] === "string" && typeof value_5[1] === "number").to.be.equal(true);
        (0, chai_1.expect)((() => {
            const value_6 = { a: "Hello" };
            if (typeof value_6 !== "string")
                if (typeof value_6 !== "object" || value_6 === null)
                    return false;
                else {
                    if (typeof value_6.a !== "number")
                        return false;
                }
            return true;
        })()).to.equal(false);
    });
});
