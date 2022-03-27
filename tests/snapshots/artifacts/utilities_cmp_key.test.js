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
                if (a.a !== "a" && a.a !== "b" && a.a !== 123)
                    throw new Error("Expected a.a to be \"a\" | \"b\" | 123.");
                return a;
            }
            it("Throw when the key doesn't equal any of the value's types", () => {
                (0, chai_1.expect)((0, utils_1.call)(test2, { a: "c" })).to.throw(/Expected a\.a to be ((123 \| "a" \| "b"\.)|("a" \| "b" \| 123\.))/);
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
            function test4(a) {
                if (typeof a !== "object")
                    throw new Error("Expected a to be { a: string; b: number; }.");
                if (typeof a["a"] !== "string")
                    throw new Error("Expected a.a to be string.");
                if (typeof a["b"] !== "number")
                    throw new Error("Expected a.b to be number.");
                if (a.a !== "abc")
                    throw new Error("Expected a.a to be \"abc\".");
                return a;
            }
            it("Throw when some of the types of the object's properties are incorrect with the correct others option", () => {
                (0, chai_1.expect)((0, utils_1.call)(test4, { a: "abc", b: "bce" })).to.throw("Expected a.b to be number.");
            });
        });
    });
});
