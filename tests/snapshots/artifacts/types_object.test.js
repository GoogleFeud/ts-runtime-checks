"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Object", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be an object");
            if (typeof a.a !== "string")
                throw new Error("Expected a.a to be a string");
            if ("b" in a && typeof a.b !== "number")
                throw new Error("Expected a.b to be a number");
            if (!Array.isArray(a.c))
                throw new Error("Expected a.c to be an array");
            for (let i_1 = 0; i_1 < a.c.length; i_1++) {
                if (typeof a.c[i_1] !== "string")
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
    });
});
