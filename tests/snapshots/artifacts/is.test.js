"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Is function", () => {
    it("Return false when the value does not match the type", () => {
        (0, chai_1.expect)((() => {
            const temp_1 = 123;
            if (typeof temp_1 !== "string")
                return false;
            return true;
        })()).to.be.equal(false);
        (0, chai_1.expect)((() => {
            const temp_2 = { a: "Hello", b: 3.14 };
            if (typeof temp_2 !== "object")
                return false;
            if (typeof temp_2["a"] !== "number")
                return false;
            if (typeof temp_2["b"] !== "string")
                return false;
            return true;
        })()).to.be.equal(false);
        (0, chai_1.expect)((() => {
            const temp_3 = -1;
            if (typeof temp_3 !== "string" && (typeof temp_3 !== "number" || temp_3 < 1 || temp_3 > 100))
                return false;
            return true;
        })()).to.be.equal(false);
    });
    it("Return true when the value matches the type", () => {
        (0, chai_1.expect)((() => {
            const temp_4 = true;
            if (typeof temp_4 !== "boolean")
                return false;
            return true;
        })()).to.be.equal(true);
        (0, chai_1.expect)((() => {
            const temp_5 = ["a", 123];
            if (!(temp_5 instanceof Array))
                return false;
            if (typeof temp_5[0] !== "string")
                return false;
            if (typeof temp_5[1] !== "number")
                return false;
            return true;
        })()).to.be.equal(true);
        (0, chai_1.expect)((() => {
            const temp_6 = { a: "Hello" };
            if (typeof temp_6 !== "string" && typeof temp_6 !== "object")
                return false;
            return true;
        })()).to.equal(true);
    });
});
