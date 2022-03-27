"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Object deconstruction", () => {
    describe("Assert", () => {
        function test({ a, b }) {
            if (typeof a !== "number")
                throw new Error("Expected a to be number.");
            if (typeof b !== "string")
                throw new Error("Expected b to be string.");
            return [a, b];
        }
        describe("In function parameters", () => {
            it("Throw when one of the deconstructed properties has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: "Hello", b: "..." })).to.throw("Expected a to be number.");
            });
            it("Not throw when a non-deconstructed property has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: 123, b: "123", c: 123 })).to.not.throw();
            });
        });
    });
});
