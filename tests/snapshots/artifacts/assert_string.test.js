"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Assert", function () { describe("<string>", function () {
    it("Throw when a string is not provided", function () {
        function test(a) { if (typeof a !== "string")
            throw new Error("Expected a to be string."); return a; }
        (0, chai_1.expect)(test("hello")).to.be.equal("hello");
        (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be string.");
    });
    it("Not throw when the string is optional and not provided", function () {
        function test(a) { if (a !== undefined && typeof a !== "string")
            throw new Error("Expected a to be string."); return a; }
        (0, chai_1.expect)(test()).to.be.undefined;
        (0, chai_1.expect)(test("abc")).to.be.equal("abc");
        (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be string.");
    });
}); });
