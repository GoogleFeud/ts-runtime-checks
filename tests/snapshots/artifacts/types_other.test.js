"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Symbol / Bigint", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (typeof a !== "symbol")
                throw new Error("Expected a to be symbol.");
            if (typeof b !== "bigint")
                throw new Error("Expected b to be bigint.");
            return [a, b];
        }
        it("Not throw when the right types are provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, Symbol(), 123n)).to.not.throw();
        });
        it("Throw when wrong types are provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 123, 123n)).to.throw("Expected a to be symbol.");
            (0, chai_1.expect)((0, utils_1.call)(test, Symbol(), 123)).to.throw("Expected b to be bigint.");
        });
    });
});
