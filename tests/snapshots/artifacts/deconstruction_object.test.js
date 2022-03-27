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
        function test2({ a, d: { c } }) {
            if (typeof a !== "number")
                throw new Error("Expected a to be number.");
            if (c !== 123)
                throw new Error("Expected c to be 123.");
            return [a, c];
        }
        describe("In function parameters", () => {
            it("Throw when one of the deconstructed properties has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: "Hello", b: "..." })).to.throw("Expected a to be number.");
            });
            it("Not throw when a non-deconstructed property has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: 123, b: "123", c: 123 })).to.not.throw();
            });
            it("Throw when one of the nested deconstructed properties has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: 123, d: { c: 456 } })).to.throw("Expected c to be 123.");
            });
            it("Not throw when a nested non-deconstructed property has a wrong type", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: 123, d: { c: 123, b: 345 } })).to.not.throw();
            });
        });
    });
});
