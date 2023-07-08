"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Unions", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "string" && typeof a !== "number")
                if (!Array.isArray(a))
                    throw new Error("Expected a to be one of string, number, [string | number, string]");
                else {
                    if (typeof a[1] !== "string")
                        throw new Error("Expected a[1] to be a string");
                    if (typeof a[0] !== "string" && typeof a[0] !== "number")
                        throw new Error("Expected a[0] to be one of string, number");
                }
            return a;
        }
        it("Throw when a different type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, true)).to.throw("Expected a to be one of string, number, [string | number, string]");
            (0, chai_1.expect)((0, utils_1.call)(test, test)).to.throw("Expected a to be one of string, number, [string | number, string]");
            (0, chai_1.expect)((0, utils_1.call)(test, {})).to.throw("Expected a to be one of string, number, [string | number, string]");
        });
        it("Not throw when a value of the right type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "Hello")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, [33, "World"])).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.not.throw();
        });
    });
});
