"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Tuple", () => {
    describe("Assert", () => {
        function test(a) {
            if (!Array.isArray(a))
                throw new Error("Expected a to be [string, \"123\", undefined | number]");
            if (a[1] !== "123")
                throw new Error("Expected a[1] to be \"123\"");
            if (typeof a[0] !== "string")
                throw new Error("Expected a[0] to be a string");
            if (a[2] !== undefined && typeof a[2] !== "number")
                throw new Error("Expected a[2] to be undefined | number");
            return a;
        }
        it("Throw when one of the values is undefined", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["abc"])).to.throw("Expected a[1] to be \"123\"");
        });
        it("Throw when the tuple is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be [string, \"123\", undefined | number]");
        });
        it("Throw when one of the values has a wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["abc", "123", "Hello"])).to.throw("Expected a[2] to be undefined | number");
            (0, chai_1.expect)((0, utils_1.call)(test, ["abc", 123, "Hello"])).to.throw("Expected a[1] to be \"123\"");
            (0, chai_1.expect)((0, utils_1.call)(test, [Symbol(), "123", "Hello"])).to.throw("Expected a[0] to be a string");
        });
        it("Not throw when all the types are correct", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["Hello", "123"])).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, ["Hello", "123", 444])).to.not.throw();
        });
    });
});
