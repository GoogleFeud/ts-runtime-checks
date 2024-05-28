"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Exact Props", () => {
    describe("Raise Error", () => {
        function test(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be object");
            if (typeof a.a !== "string")
                throw new Error("Expected a.a to be a string");
            if (typeof a.b !== "number")
                throw new Error("Expected a.b to be a number");
            if (a.c !== undefined && typeof a.c !== "string")
                throw new Error("Expected a.c to be undefined | string");
            for (let p_1 in a) {
                if (p_1 !== "a" && p_1 !== "b" && p_1 !== "c")
                    throw new Error("Property a." + p_1 + " is excessive");
            }
            return a;
        }
        it("Throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, { a: "a", b: 234, d: 33 })).to.throw("Property a.d is excessive");
        });
        it("Not throw when there aren't excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, { a: "a", b: 2345, c: "b" })).to.not.throw();
        });
        function test2(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be object");
            if (typeof a.a !== "object" || a.a === null)
                throw new Error("Expected a.a to be object");
            if (typeof a.a.b !== "string")
                throw new Error("Expected a.a.b to be a string");
            for (let p_2 in a.a) {
                if (p_2 !== "b")
                    throw new Error("Property a.a." + p_2 + " is excessive");
            }
            for (let p_3 in a) {
                if (p_3 !== "a")
                    throw new Error("Property a." + p_3 + " is excessive");
            }
            return a;
        }
        it("Throw when there are excessive nested properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: { b: "c2", c: 12 } })).to.throw("Property a.a.c is excessive");
        });
        it("Not throw when there are excessive nested properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: { b: "c2" } })).to.not.throw();
        });
        function test3(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be object");
            const { b: b_1 } = a;
            if (typeof a.a !== "string")
                throw new Error("Expected a.a to be a string");
            if (typeof b_1 !== "object" || b_1 === null)
                throw new Error("Expected a.b to be object");
            if (typeof b_1.c !== "number")
                throw new Error("Expected a.b.c to be a number");
            for (let p_4 in b_1) {
                if (p_4 !== "c")
                    throw new Error("Property a.b." + p_4 + " is excessive");
            }
            return a;
        }
        it("Not throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, { a: "123", d: 123, b: { c: 123 } })).to.not.throw();
        });
        it("Throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, { a: "123", d: 123, b: { c: 123, d: 32 } })).to.throw("Property a.b.d is excessive");
        });
    });
    describe("Remove excessive", () => {
        it("Should remove extra properties", () => {
            function test(a) {
                if (typeof a !== "object" || a === null)
                    throw new Error("Expected a to be object");
                if (typeof a.a !== "string")
                    throw new Error("Expected a.a to be a string");
                if (typeof a.b !== "number")
                    throw new Error("Expected a.b to be a number");
                if (a.c !== undefined && typeof a.c !== "string")
                    throw new Error("Expected a.c to be undefined | string");
                for (let p_5 in a) {
                    if (p_5 !== "a" && p_5 !== "b" && p_5 !== "c")
                        a[p_5] = undefined;
                }
                (0, chai_1.expect)(a.d).to.be(undefined);
                return a;
            }
            (0, utils_1.call)(test, { a: "abc", b: 123, d: 456 });
        });
    });
});
