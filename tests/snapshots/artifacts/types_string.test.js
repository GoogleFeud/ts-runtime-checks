"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("string", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "string")
                throw new Error("Expected a to be string.");
            return a;
        }
        function test2(a) {
            if (a !== "abc")
                throw new Error("Expected a to be \"abc\".");
            return a;
        }
        describe("In function parameters", () => {
            it("Throw when a string is not provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be string.");
                (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be string.");
            });
            it("Not throw when a string is provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, "abc3de3de3")).to.not.throw();
            });
            it("Throw when the string literal is not the same", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, "abcd")).to.throw("Expected a to be \"abc\".");
            });
            it("Not throw when the string literal is the same", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, "abc")).to.not.throw();
            });
        });
    });
});
