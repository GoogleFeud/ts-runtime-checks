"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const chai_1 = require("chai");
describe("Early return", () => {
    function test(a, b) {
        if (typeof a !== "string")
            return undefined;
        if (typeof b !== "number")
            return undefined;
        return true;
    }
    it("Return undefined when a parameter type is wrong", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, "Hello", "World")()).to.be.equal(undefined);
        (0, chai_1.expect)(test("Hello", 123)).to.be.equal(true);
    });
    function test2(a) {
        if (typeof a !== "object")
            return a.a === undefined ? "a" : "b";
        if (typeof a["a"] !== "number")
            return a.a === undefined ? "a" : "b";
        if (typeof a["b"] !== "string")
            return a.a === undefined ? "a" : "b";
        return "c";
    }
    it("Return the custom return value", () => {
        (0, chai_1.expect)((0, utils_1.call)(test2, { b: "abc" })()).to.be.equal("a");
        (0, chai_1.expect)((0, utils_1.call)(test2, { b: "abc", a: 123 })()).to.be.equal("c");
    });
    function test3(a) {
        if (typeof a !== "object")
            return "Expected a to be { a: [string, number, ({ b: number; } | undefined)?]; }.";
        if (!(a["a"] instanceof Array))
            return "Expected a.a to be [string, number, ({ b: number; } | undefined)?].";
        if (typeof a["a"][0] !== "string")
            return "Expected " + ("a.a[" + 0 + "]") + " to be string.";
        if (typeof a["a"][1] !== "number")
            return "Expected " + ("a.a[" + 1 + "]") + " to be number.";
        if (a["a"][2] !== undefined) {
            if (typeof a["a"][2] !== "object")
                return "Expected " + ("a.a[" + 2 + "]") + " to be { b: number; }.";
            if (typeof a["a"][2]["b"] !== "number")
                return "Expected " + ("a.a[" + 2 + "].b") + " to be number.";
        }
        return true;
    }
    it("Return the error message if specified", () => {
        (0, chai_1.expect)((0, utils_1.call)(test3, { a: ["Hello", "World"] })()).to.be.equal("Expected a.a[1] to be number.");
        (0, chai_1.expect)((0, utils_1.call)(test3, { a: ["Hello", 123, { b: "World" }] })()).to.be.equal("Expected a.a[2].b to be number.");
    });
});
