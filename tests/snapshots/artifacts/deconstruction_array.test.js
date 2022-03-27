"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Array deconstruction", () => {
    describe("Assert", () => {
        function test([a, b], [c, d]) {
            if (typeof a !== "string")
                throw new Error("Expected a to be string.");
            if (typeof b !== "string")
                throw new Error("Expected b to be string.");
            if (typeof c !== "number")
                throw new Error("Expected c to be number.");
            if (typeof d !== "string")
                throw new Error("Expected d to be string.");
            return [a, b, c, d];
        }
        describe("In function parameters", () => {
            it("Throw when one of the deconstructed properties has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, ["a", 123], [123, "abc"])).to.throw("Expected b to be string.");
                (0, chai_1.expect)((0, utils_1.call)(test, ["a", "b"], ["abc", "abc"])).to.throw("Expected c to be number.");
            });
            it("Not throw when a non-deconstructed property has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, ["a", "b", 123], [1, "2", "3"])).to.not.throw();
            });
        });
    });
});
