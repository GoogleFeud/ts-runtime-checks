"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Unions", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "string" && typeof a !== "number" && !(a instanceof Array))
                throw new Error("Expected a to be string | number | [string | number, string].");
            return a;
        }
        describe("In function parameters", () => {
            it("Throw when a different type is provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, true)).to.throw("Expected a to be string | number | [string | number, string].");
                (0, chai_1.expect)((0, utils_1.call)(test, test)).to.throw("Expected a to be string | number | [string | number, string].");
                (0, chai_1.expect)((0, utils_1.call)(test, {})).to.throw("Expected a to be string | number | [string | number, string].");
            });
            it("Not throw when a value of the right type is provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, "Hello")).to.not.throw();
                (0, chai_1.expect)((0, utils_1.call)(test, [33, "World"])).to.not.throw();
                (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.not.throw();
            });
        });
    });
});
