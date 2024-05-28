"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const chai_1 = require("chai");
describe("Type assertions (as)", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (!Array.isArray(a))
                throw new Error("Expected a to be an array<number>");
            for (let i_1 = 0; i_1 < a.length; i_1++) {
                if (typeof a[i_1] !== "number")
                    throw new Error("Expected a[" + i_1 + "] to be a number");
            }
            if (typeof b !== "object" || b === null)
                throw new Error("Expected b to be object");
            const { d: d_1, c: c_1 } = b;
            if (typeof b.a !== "number")
                throw new Error("Expected b.a to be a number");
            if (typeof b.b !== "string")
                throw new Error("Expected b.b to be a string");
            if (!Array.isArray(d_1))
                throw new Error("Expected b.d to be [string, symbol, number]");
            if (typeof d_1[0] !== "string")
                throw new Error("Expected b.d[0] to be a string");
            if (typeof d_1[2] !== "number")
                throw new Error("Expected b.d[2] to be a number");
            if (typeof d_1[1] !== "symbol")
                throw new Error("Expected b.d[1] to be a symbol");
            if (c_1 !== undefined) {
                if (!Array.isArray(c_1))
                    throw new Error("Expected b.c to be an array<string>");
                for (let i_2 = 0; i_2 < c_1.length; i_2++) {
                    if (typeof c_1[i_2] !== "string")
                        throw new Error("Expected b.c[" + i_2 + "] to be a string");
                }
                ;
            }
            return [a, b];
        }
        function test1(a, b) {
            if (!Array.isArray(a))
                throw new Error("Expected a to be an array<number>");
            for (let i_3 = 0; i_3 < a.length; i_3++) {
                if (typeof a[i_3] !== "number")
                    throw new Error("Expected a[" + i_3 + "] to be a number");
            }
            if (typeof b !== "object" || b === null)
                throw new Error("Expected b to be object");
            const { d: d_2, c: c_2 } = b;
            if (typeof b.a !== "number")
                throw new Error("Expected b.a to be a number");
            if (typeof b.b !== "string")
                throw new Error("Expected b.b to be a string");
            if (!Array.isArray(d_2))
                throw new Error("Expected b.d to be [string, symbol, number]");
            if (typeof d_2[0] !== "string")
                throw new Error("Expected b.d[0] to be a string");
            if (typeof d_2[2] !== "number")
                throw new Error("Expected b.d[2] to be a number");
            if (typeof d_2[1] !== "symbol")
                throw new Error("Expected b.d[1] to be a symbol");
            if (c_2 !== undefined) {
                if (!Array.isArray(c_2))
                    throw new Error("Expected b.c to be an array<string>");
                for (let i_4 = 0; i_4 < c_2.length; i_4++) {
                    if (typeof c_2[i_4] !== "string")
                        throw new Error("Expected b.c[" + i_4 + "] to be a string");
                }
                ;
            }
            return [a, b];
        }
        it("No difference between parameter assertions and as assetions", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"] })).to.throw("Expected b.d[2] to be a number");
            (0, chai_1.expect)((0, utils_1.call)(test1, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"] })).to.throw("Expected b.d[2] to be a number");
        });
    });
});
