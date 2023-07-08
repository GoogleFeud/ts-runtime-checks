"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("NoCheck", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (typeof b !== "string")
                throw new Error("Expected b to be a string");
            return [a, b];
        }
        it("Not throw when a wrong type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 123, "abc")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, [123, "AAA"], "abc")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, undefined, 123)).to.throw("Expected b to be a string");
        });
    });
});
