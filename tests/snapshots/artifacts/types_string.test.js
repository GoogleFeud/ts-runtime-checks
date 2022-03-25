"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("string", function () { describe("Assert", function () { function test(a) { if (typeof a !== "string")
    throw new Error("Expected a to be string."); return a; } describe("In function parameters", function () {
    it("Throw when a string is not provided", function () {
        (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be string.");
        (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be string.");
    });
    it("Not throw when a string is provided", function () { (0, chai_1.expect)(test("abc")).to.be.equal("abc"); });
}); }); });
