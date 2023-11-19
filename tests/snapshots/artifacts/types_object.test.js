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
                throw new Error("Expected a.b to be a number");
            if (!Array.isArray(c_1))
                throw new Error("Expected a.c to be an array");
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
            })).to.throw("Expected a.b to be a number");
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
            for (let p_1 in a)
                if (typeof p_1 === "string" && p_1.length > 3) {
                    if (typeof a[p_1] !== "number")
                        throw new Error("Expected a[" + p_1 + "] to be a number");
                }
                else
                    throw new Error("Expected key " + p_1 + " of a " + ("to be a string" + ", " + "to have a length greater than 3"));
            return true;
        }
        it("Throw when key is wrong (Record)", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: 123, [2]: 34 })).to.throw("Expected key 2 of a to be a string, to have a length greater than 3");
        });
        function test3(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be an object");
            for (let p_2 in a)
                if (typeof p_2 === "number" && p_2 > 3) {
                    if (typeof a[p_2] !== "string")
                        throw new Error("Expected a[" + p_2 + "] to be a string");
                }
                else if (typeof p_2 === "string" && /abc/g.test(p_2)) {
                    if (typeof a[p_2] !== "number")
                        throw new Error("Expected a[" + p_2 + "] to be a number");
                }
                else
                    throw new Error("Expected key " + p_2 + " of a " + ("to be a number" + ", " + "to be greater than 3") + ", or " + ("to be a string" + ", " + "to match /abc/g"));
            return true;
        }
        it("Throw when there are multiple index types", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, {
                [1]: "abc",
                [2]: "hello",
                abc123: "a",
                other: "3"
            })).to.throw("Expected key 1 of a to be a number, to be greater than 3, or to be a string, to match /abc/g");
        });
    });
});
