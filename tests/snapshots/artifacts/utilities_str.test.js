"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Str", () => {
    describe("Str<{matches}>", () => {
        function test(a) {
            if (typeof a !== "string" || !/foo*/g.test(a))
                throw new Error("Expected a to be a string, to match /foo*/g");
            return a;
        }
        it("Throw when the regex doesn't match", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "hello")).to.throw("Expected a to be a string, to match /foo*/g");
        });
        it("Not throw when the regex matches", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "soccer is not football")).to.not.throw();
        });
        it("Throw when the provided value is not string", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.throw("Expected a to be a string, to match /foo*/g");
            (0, chai_1.expect)((0, utils_1.call)(test)).to.throw("Expected a to be a string, to match /foo*/g");
        });
        function test2(a) {
            if (typeof a !== "string")
                throw new Error("Expected a to be a string");
            return a;
        }
        it("Check only if the parameter is a string, if regex is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, "hello")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test2, 123)).to.throw("Expected a to be a string");
        });
    });
    describe("Str<{length}>", () => {
        function test(a) {
            if (typeof a !== "string" || a.length !== 32)
                throw new Error("Expected a to be a string, to have a length of 32");
            return a;
        }
        it("Throw when the length doesn't match", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "hello")).to.throw("Expected a to be a string, to have a length of 32");
        });
        it("Not throw when the regex matches", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "a".repeat(32))).to.not.throw();
        });
    });
    describe("Str<{matches, length}>", () => {
        function test(a) {
            if (typeof a !== "string" || a.length !== 12 || !/foo*/g.test(a))
                throw new Error("Expected a to be a string, to have a length of 12, to match /foo*/g");
            return a;
        }
        it("Throw when the length doesn't match", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "foofoo")).to.throw("Expected a to be a string, to have a length of 12, to match /foo*/g");
        });
        it("Not throw when the regex matches", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "foo".repeat(4))).to.not.throw();
        });
    });
    describe("Str<{minLen}>", () => {
        function test(a) {
            if (typeof a !== "string" || a.length < 6)
                throw new Error("Expected a to be a string, to have a length greater than 6");
            return a;
        }
        it("Throw when the correct length is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "abede")).to.throw("Expected a to be a string, to have a length greater than 6");
        });
        it("Not throw when the correct length is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "abcdewdwdw")).to.not.throw();
        });
    });
    describe("Str<{maxLen}>", () => {
        function test(a) {
            if (typeof a !== "string" || a.length > 9)
                throw new Error("Expected a to be a string, to have a length less than 9");
            return a;
        }
        it("Throw when the correct length is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "abwdwdwdwdwdwdwdwdwdwdwdwdwd")).to.throw("Expected a to be a string, to have a length less than 9");
        });
        it("Not throw when the correct length is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "abcde")).to.not.throw();
        });
    });
});
