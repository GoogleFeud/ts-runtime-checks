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
        if (typeof a !== "object" || a === null || typeof a.a !== "number" || typeof a.b !== "string")
            return a.a === undefined ? "a" : "b";
        return "c";
    }
    it("Return the custom return value", () => {
        (0, chai_1.expect)((0, utils_1.call)(test2, { b: "abc" })()).to.be.equal("a");
        (0, chai_1.expect)((0, utils_1.call)(test2, { b: "abc", a: 123 })()).to.be.equal("c");
    });
    function test3(a) {
        if (typeof a !== "object" || a === null)
            return "Expected a to be object";
        const { a: a_1 } = a;
        if (!Array.isArray(a_1))
            return "Expected a.a to be [string, number, undefined | object]";
        const [t_1, t_2, t_3] = a_1;
        if (typeof t_1 !== "string")
            return "Expected a.a[0] to be a string";
        if (typeof t_2 !== "number")
            return "Expected a.a[1] to be a number";
        if (t_3 !== undefined) {
            if (typeof t_3 !== "object" || t_3 === null)
                return "Expected a.a[2] to be object";
            if (typeof t_3.b !== "number")
                return "Expected a.a[2].b to be a number";
            ;
        }
        return true;
    }
    it("Return the error message if specified", () => {
        (0, chai_1.expect)((0, utils_1.call)(test3, { a: ["Hello", "World"] })()).to.be.equal("Expected a.a[1] to be a number");
        (0, chai_1.expect)((0, utils_1.call)(test3, { a: ["Hello", 123, { b: "World" }] })()).to.be.equal("Expected a.a[2].b to be a number");
    });
});
