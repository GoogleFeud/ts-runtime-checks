"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Range", function () { describe("Assert", function () { describe("In function parameters", function () {
    function test(a) { if (typeof a !== "number" || (a < 1 || a > 5))
        throw new Error("Expected a to be Range<1, 5>."); return a; }
    it("Throw when the number is outside of the range", function () { (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be Range<1, 5>."); });
    it("Not throw when the number is in range", function () { (0, chai_1.expect)((0, utils_1.call)(test, 3)).to.not.throw(); });
    it("Throw when the provided value is not a number", function () {
        (0, chai_1.expect)((0, utils_1.call)(test, "abc")).to.throw("Expected a to be Range<1, 5>.");
        (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be Range<1, 5>.");
    });
    function test2(a) { if (typeof a !== "number" || a > 30)
        throw new Error("Expected a to be Range<number, 30>."); return a; }
    it("Not throw when only a max is specified", function () {
        (0, chai_1.expect)((0, utils_1.call)(test2, -44)).to.not.throw();
        (0, chai_1.expect)((0, utils_1.call)(test2, 123)).to.throw("Expected a to be Range<number, 30>.");
    });
    function test3(a) { if (typeof a !== "number" || a < -30)
        throw new Error("Expected a to be Range<-30, number>."); return a; }
    it("Not throw when only a min is specified", function () {
        (0, chai_1.expect)((0, utils_1.call)(test3, 12233)).to.not.throw();
        (0, chai_1.expect)((0, utils_1.call)(test3, -44)).to.throw("Expected a to be Range<-30, number>.");
    });
}); }); });