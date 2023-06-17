"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Is function", () => {
    it("Return false when the value does not match the type", () => {
        const value_1 = 123;
        (0, chai_1.expect)(typeof value_1 === "string").to.be.equal(false);
        (0, chai_1.expect)((() => {
            const value_3 = { a: "Hello", b: 3.14 };
            if (typeof value_3 !== "object" && value_3 !== null)
                return false;
            if (typeof value_3.a !== "number")
                return false;
            if (typeof value_3.b !== "string")
                return false;
            return true;
        })()).to.be.equal(false);
        const value_2 = -1;
        (0, chai_1.expect)(typeof value_2 === "string" || (typeof value_2 === "number" && value_2 > 1 && value_2 < 100)).to.be.equal(false);
    });
    it("Return true when the value matches the type", () => {
        const value_4 = true;
        (0, chai_1.expect)(typeof value_4 === "boolean").to.be.equal(true);
        (0, chai_1.expect)((() => {
            const value_5 = ["a", 123];
            if (!(value_5 instanceof Array))
                return false;
            if (typeof value_5[0] !== "string")
                return false;
            if (typeof value_5[1] !== "number")
                return false;
            return true;
        })()).to.be.equal(true);
        (0, chai_1.expect)((() => {
            const value_6 = { a: "Hello" };
            if (typeof value_6 !== "string")
                if (typeof value_6 !== "object" && value_6 !== null)
                    return false;
                else {
                    if (typeof value_6.a !== "number")
                        return false;
                }
            return true;
        })()).to.equal(false);
    });
});
