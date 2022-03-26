"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("CmpKey", () => {
    describe("Assert", () => {
        describe("In function parameters", () => {
            function test(a) {
                if (a.a !== 3.14)
                    throw new Error("Expected a.a to be 3.14.");
                return a;
            }
            it("Throw when the key doesn't equal the value", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: 314 })).to.throw("Expected a.a to be 3.14.");
            });
            function test2(a) {
                if (a.a !== 123 && a.a !== "a" && a.a !== "b")
                    throw new Error("Expected a.a to be 123 | \"a\" | \"b\".");
                return a;
            }
            it("Throw when the key doesn't equal any of the value's types", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: "c" })).to.throw("Expected a.a to be 123 | \"a\" | \"b\".");
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: 123 })).to.not.throw();
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: "b" })).to.not.throw();
            });
        });
    });
});
