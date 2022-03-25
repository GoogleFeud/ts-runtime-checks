"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Matches", () => { describe("Assert", () => { describe("In function parameters", () => {
    function test(a) { if (typeof a !== "string" || !/foo*/g.test(a))
        throw new Error("Expected a to be Matches<\"/foo*/g\">."); return a; }
    it("Throw when the regex doesn't match", () => { (0, chai_1.expect)((0, utils_1.call)(test, "hello")).to.throw("Expected a to be Matches<\"/foo*/g\">."); });
    it("Not throw when the regex matches", () => { (0, chai_1.expect)((0, utils_1.call)(test, "soccer is not football")).to.not.throw(); });
    it("Throw when the provided value is not string", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be Matches<\"/foo*/g\">.");
        (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be Matches<\"/foo*/g\">.");
    });
    function test2(a) { if (typeof a !== "string")
        throw new Error("Expected a to be Matches<string>."); return a; }
    it("Check only if the parameter is a string, if regex is not provided", () => {
        (0, chai_1.expect)((0, utils_1.call)(test2, "hello")).to.not.throw();
        (0, chai_1.expect)((0, utils_1.call)(test2, 123)).to.throw("Expected a to be Matches<string>.");
    });
}); }); });
