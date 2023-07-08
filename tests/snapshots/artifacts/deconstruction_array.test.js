"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Array deconstruction", () => {
    describe("Assert", () => {
        function test([a, b], [c, d]) {
            if (typeof a !== "string")
                throw new Error("Expected a to be a string");
            if (typeof b !== "string")
                throw new Error("Expected b to be a string");
            if (typeof c !== "number")
                throw new Error("Expected c to be a number");
            if (typeof d !== "string")
                throw new Error("Expected d to be a string");
            return [a, b, c, d];
        }
        function test2([a, [c]]) {
            if (typeof a !== "string")
                throw new Error("Expected a to be a string");
            if (typeof c !== "number")
                throw new Error("Expected c to be a number");
            return [a, c];
        }
        it("Throw when one of the deconstructed properties has a wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["a", 123], [123, "abc"])).to.throw("Expected b to be a string");
            (0, chai_1.expect)((0, utils_1.call)(test, ["a", "b"], ["abc", "abc"])).to.throw("Expected c to be a number");
        });
        it("Not throw when a non-deconstructed property has a wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["a", "b", 123], [1, "2", "3"])).to.not.throw();
        });
        it("Throw when one of the nested deconstructed properties has a wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, ["abc", ["abc"]])).to.throw("Expected c to be a number");
        });
        it("Not throw when a non-deconstructed nested property has a wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, ["abc", [123, "456"]])).to.not.throw();
        });
    });
});
