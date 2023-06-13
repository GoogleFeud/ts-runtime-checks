"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Is function", () => {
    it("Return false when the value does not match the type", () => {
        (0, chai_1.expect)((() => {
            const value_1 = 123;
            if (typeof value_1 !== "string")
                return false;
            return true;
        })()).to.be.equal(false);
        (0, chai_1.expect)((() => {
            const value_2 = { a: "Hello", b: 3.14 };
            if (typeof value_2 !== "object" && value_2 !== null)
                return false;
            if (typeof value_2.a !== "number")
                return false;
            if (typeof value_2.b !== "string")
                return false;
            return true;
        })()).to.be.equal(false);
        (0, chai_1.expect)((() => {
            const value_3 = -1;
            if (typeof value_3 !== "string" && (typeof value_3 !== "number" || value_3 < 1 || value_3 > 100))
                return false;
            return true;
        })()).to.be.equal(false);
    });
    it("Return true when the value matches the type", () => {
        (0, chai_1.expect)((() => {
            const value_4 = true;
            if (typeof value_4 !== "boolean")
                return false;
            return true;
        })()).to.be.equal(true);
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
