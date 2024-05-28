"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Number", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "number")
                throw new Error("Expected a to be a number");
            return a;
        }
        function test2(a) {
            if (a !== 123)
                throw new Error("Expected a to be 123");
            return a;
        }
        it("Throw when a number is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "abc")).to.throw("Expected a to be a number");
            (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be a number");
        });
        it("Not throw when a number is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 123)).to.not.throw();
        });
        it("Throw when the number literal is not the same", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, 1234)).to.throw("Expected a to be 123");
        });
        it("Not throw when the number literal is the same", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, 123)).to.not.throw();
        });
    });
});
