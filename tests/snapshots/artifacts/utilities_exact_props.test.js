"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Exact Props", () => {
    describe("Raise Error", () => {
        function test(a) {
            if (typeof a !== "object")
                throw new Error("Expected a to be { a: string; b: number; c?: string | undefined; }.");
            for (let name_1 in a) {
                if (name_1 !== "a" && name_1 !== "b" && name_1 !== "c")
                    throw new Error("Property " + ("a." + name_1) + " is excessive.");
            }
            if (typeof a["a"] !== "string")
                throw new Error("Expected a.a to be string.");
            if (typeof a["b"] !== "number")
                throw new Error("Expected a.b to be number.");
            if ("c" in a && typeof a["c"] !== "string")
                throw new Error("Expected a.c to be string.");
            return a;
        }
        it("Throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, { a: "a", b: 234, d: 33 })).to.throw("Property a.d is excessive.");
        });
        it("Not throw when there aren't excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, { a: "a", b: 2345, c: "b" })).to.not.throw();
        });
        function test2(a) {
            if (typeof a !== "object")
                throw new Error("Expected a to be { a: { b: string; }; }.");
            for (let name_2 in a) {
                if (name_2 !== "a")
                    throw new Error("Property " + ("a." + name_2) + " is excessive.");
            }
            if (typeof a["a"] !== "object")
                throw new Error("Expected a.a to be { b: string; }.");
            for (let name_3 in a["a"]) {
                if (name_3 !== "b")
                    throw new Error("Property " + ("a.a." + name_3) + " is excessive.");
            }
            if (typeof a["a"]["b"] !== "string")
                throw new Error("Expected a.a.b to be string.");
            return a;
        }
        it("Throw when there are excessive nested properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: { b: "c2", c: 12 } })).to.throw("Property a.a.c is excessive.");
        });
        it("Not throw when there are excessive nested properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { a: { b: "c2" } })).to.not.throw();
        });
        function test3(a) {
            if (typeof a !== "object")
                throw new Error("Expected a to be { a: string; b: ExactProps<{ c: number; }, false>; }.");
            if (typeof a["a"] !== "string")
                throw new Error("Expected a.a to be string.");
            if (typeof a["b"] !== "object")
                throw new Error("Expected a.b to be { c: number; }.");
            for (let name_4 in a["b"]) {
                if (name_4 !== "c")
                    throw new Error("Property " + ("a.b." + name_4) + " is excessive.");
            }
            if (typeof a["b"]["c"] !== "number")
                throw new Error("Expected a.b.c to be number.");
            return a;
        }
        it("Not throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, { a: "123", d: 123, b: { c: 123 } })).to.not.throw();
        });
        it("Throw when there are excessive properties", () => {
            (0, chai_1.expect)((0, utils_1.call)(test3, { a: "123", d: 123, b: { d: 32 } })).to.throw("Property a.b.d is excessive.");
        });
    });
    describe("Remove excessive", () => {
        it("Should remove extra properties", () => {
            function test(a) {
                if (typeof a !== "object")
                    throw new Error("Expected a to be { a: string; b: number; c?: string | undefined; }.");
                for (let name_5 in a) {
                    if (name_5 !== "a" && name_5 !== "b" && name_5 !== "c")
                        delete a[name_5];
                }
                if (typeof a["a"] !== "string")
                    throw new Error("Expected a.a to be string.");
                if (typeof a["b"] !== "number")
                    throw new Error("Expected a.b to be number.");
                if ("c" in a && typeof a["c"] !== "string")
                    throw new Error("Expected a.c to be string.");
                (0, chai_1.expect)(a.d).to.be(undefined);
                return a;
            }
            (0, utils_1.call)(test, { a: "abc", b: 123, d: 456 });
        });
    });
});
