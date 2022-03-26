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
            it("Not throw when the right value is provided", () => {
                (0, chai_1.expect)((0, utils_1.call)(test, { a: 3.14 })).to.not.throw();
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
            const someVar = 3001;
            function test3(a) {
                if (a.b !== someVar)
                    throw new Error("Expected a.b to be Var<\"someVar\">.");
                return a;
            }
            it("Throw when the property doesn't equal variable value", () => {
                (0, chai_1.expect)((0, utils_1.call)(test3, { b: 3002 })).to.throw("Expected a.b to be Var<\"someVar\">.");
            });
        });
    });
});
