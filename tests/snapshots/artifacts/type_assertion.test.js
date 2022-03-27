"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const chai_1 = require("chai");
describe("Type assertions (as)", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (!(a instanceof Array))
                throw new Error("Expected a to be number[].");
            for (let i_1 = 0; i_1 < a.length; i_1++) {
                const x_1 = a[i_1];
                if (typeof x_1 !== "number")
                    throw new Error("Expected " + ("a[" + i_1 + "]") + " to be number.");
            }
            if (typeof b !== "object")
                throw new Error("Expected b to be { a: number; b: string; c?: string[] | undefined; d: [string, symbol, number]; }.");
            if (typeof b["a"] !== "number")
                throw new Error("Expected b.a to be number.");
            if (typeof b["b"] !== "string")
                throw new Error("Expected b.b to be string.");
            if ("c" in b) {
                if (!(b["c"] instanceof Array))
                    throw new Error("Expected b.c to be string[].");
                for (let i_2 = 0; i_2 < b["c"].length; i_2++) {
                    const x_2 = b["c"][i_2];
                    if (typeof x_2 !== "string")
                        throw new Error("Expected " + ("b.c[" + i_2 + "]") + " to be string.");
                }
            }
            if (!(b["d"] instanceof Array))
                throw new Error("Expected b.d to be [string, symbol, number].");
            if (typeof b["d"][0] !== "string")
                throw new Error("Expected " + ("b.d[" + 0 + "]") + " to be string.");
            if (typeof b["d"][1] !== "symbol")
                throw new Error("Expected " + ("b.d[" + 1 + "]") + " to be symbol.");
            if (typeof b["d"][2] !== "number")
                throw new Error("Expected " + ("b.d[" + 2 + "]") + " to be number.");
            return [a, b];
        }
        function test1(a, b) {
            if (!(a instanceof Array))
                throw new Error("Expected a to be number[].");
            for (let i_3 = 0; i_3 < a.length; i_3++) {
                const x_3 = a[i_3];
                if (typeof x_3 !== "number")
                    throw new Error("Expected " + ("a[" + i_3 + "]") + " to be number.");
            }
            if (typeof b !== "object")
                throw new Error("Expected b to be { a: number; b: string; c?: string[] | undefined; d: [string, symbol, number]; }.");
            if (typeof b["a"] !== "number")
                throw new Error("Expected b.a to be number.");
            if (typeof b["b"] !== "string")
                throw new Error("Expected b.b to be string.");
            if ("c" in b) {
                if (!(b["c"] instanceof Array))
                    throw new Error("Expected b.c to be string[].");
                for (let i_4 = 0; i_4 < b["c"].length; i_4++) {
                    const x_4 = b["c"][i_4];
                    if (typeof x_4 !== "string")
                        throw new Error("Expected " + ("b.c[" + i_4 + "]") + " to be string.");
                }
            }
            if (!(b["d"] instanceof Array))
                throw new Error("Expected b.d to be [string, symbol, number].");
            if (typeof b["d"][0] !== "string")
                throw new Error("Expected " + ("b.d[" + 0 + "]") + " to be string.");
            if (typeof b["d"][1] !== "symbol")
                throw new Error("Expected " + ("b.d[" + 1 + "]") + " to be symbol.");
            if (typeof b["d"][2] !== "number")
                throw new Error("Expected " + ("b.d[" + 2 + "]") + " to be number.");
            return [a, b];
        }
        it("No difference between parameter assertions and as assetions", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"] })).to.throw("Expected b.d[2] to be number.");
            (0, chai_1.expect)((0, utils_1.call)(test1, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"] })).to.throw("Expected b.d[2] to be number.");
        });
    });
});
