"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("number", function () { describe("Assert", function () { function test(a) { if (typeof a !== "number")
    throw new Error("Expected a to be number."); return a; } describe("In function parameters", function () {
    it("Throw when a number is not provided", function () {
        (0, chai_1.expect)((0, utils_1.call)(test, "abc")).to.throw("Expected a to be number.");
        (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be number.");
    });
    it("Not throw when a number is provided", function () { (0, chai_1.expect)(test(123)).to.be.equal(123); });
}); }); });
