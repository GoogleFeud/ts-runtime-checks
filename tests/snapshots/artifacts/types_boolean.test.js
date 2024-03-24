"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Boolean", () => {
    describe("Assert", () => {
        function test(a) {
            if (a !== false && a !== true)
                throw new Error("Expected a to be a boolean");
            return a;
        }
        it("Throw when a value is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be a boolean");
            (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be a boolean");
        });
        it("Not throw when a boolean is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, false)).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, true)).to.not.throw();
        });
    });
});
