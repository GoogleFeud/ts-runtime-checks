"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Object", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be an object");
            const { c: c_1 } = a;
            if (typeof a.a !== "string")
                throw new Error("Expected a.a to be a string");
            if (a.b !== undefined && typeof a.b !== "number")
                throw new Error("Expected a.b to be undefined | number");
            if (!Array.isArray(c_1))
                throw new Error("Expected a.c to be an array<string>");
            for (let i_1 = 0; i_1 < c_1.length; i_1++) {
                if (typeof c_1[i_1] !== "string")
                    throw new Error("Expected a.c[" + i_1 + "] to be a string");
            }
            return a;
        }
        it("Throw when one of the properties has the wrong type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, {
                a: "ABC",
                c: 123
            })).to.throw("Expected a.c to be an array");
            (0, chai_1.expect)((0, utils_1.call)(test, {
                a: "ABC",
                b: "adc",
                c: 123
            })).to.throw("Expected a.b to be undefined | number");
            (0, chai_1.expect)((0, utils_1.call)(test, {
                a: "ABC",
                b: 123,
                c: [1]
            })).to.throw("Expected a.c[0] to be a string");
        });
        it("Not throw when all of the values are of the same type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, {
                a: "ABC",
                b: 123,
                c: ["Hello"]
            })).to.not.throw();
        });
        function test2(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be an object");
            for (let p_1 in a) {
                if (p_1.length < 3)
                    throw new Error("Expected key " + p_1 + " of a to have a length greater than 3");
                if (typeof a[p_1] !== "number")
                    throw new Error("Expected a[" + p_1 + "] to be a number");
            }
            return true;
        }
        it("Throw when key is wrong (Record)", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: 123, [2]: 34 })).to.throw("Expected key 2 of a to have a length greater than 3");
        });
        function test3(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be an object");
            for (let p_2 in a)
                if (!isNaN(p_2)) {
                    const numKey_1 = parseFloat(p_2);
                    if (numKey_1 < 3)
                        throw new Error("Expected key " + p_2 + " of a to be greater than 3");
                    if (typeof a[p_2] !== "string")
                        throw new Error("Expected a[" + p_2 + "] to be a string");
                }
                else {
                    if (!/abc/g.test(p_2))
                        throw new Error("Expected key " + p_2 + " of a to match /abc/g");
                    if (typeof a[p_2] !== "number")
                        throw new Error("Expected a[" + p_2 + "] to be a number");
                }
            return true;
        }
        it("Throw when there are multiple index types", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, {
                [4]: "abc",
                [5]: "hello",
                abs123: "a",
                other: "3"
            })).to.throw("Expected key abs123 of a to match /abc/g");
        });
    });
});
