"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Boolean", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "boolean")
                throw new Error("Expected a to be boolean.");
            return a;
        }
        describe("In function parameters", () => {
            it("Throw when a value is not provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be boolean.");
                (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be boolean.");
            });
            it("Not throw when a boolean is provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, false)).to.not.throw();
                (0, chai_1.expect)((0, utils_1.call)(test, true)).to.not.throw();
            });
        });
    });
});
