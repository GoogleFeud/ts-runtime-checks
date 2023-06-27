"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Optional / nullable parameters", () => {
    function test(c, a, b) {
        if (typeof c !== "number")
            throw new Error("Expected c to be a number");
        if (a !== undefined && typeof a !== "string")
            throw new Error("Expected a to be a string");
        if (b !== undefined) {
            if (!Array.isArray(b))
                throw new Error("Expected b to be an array");
            if (typeof b[0] !== "string")
                throw new Error("Expected b[0] to be a string");
            if (typeof b[1] !== "string")
                throw new Error("Expected b[1] to be a string");
            if (2 in b && typeof b[2] !== "number")
                throw new Error("Expected b[2] to be a number");
        }
        return [a, b, c];
    }
    it("Not throw when optional parameters are not provided", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.not.throw();
    });
    it("Not throw when optional parameters are provided", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, 12, "abc", ["a", "b"])).to.not.throw();
        (0, chai_1.expect)((0, utils_1.call)(test, 12, "abc", ["a", "b", 12])).to.not.throw();
    });
});
