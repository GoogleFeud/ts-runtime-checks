"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Unions", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "string" && typeof a !== "number")
                if (!Array.isArray(a))
                    throw new Error("Expected a to be one of string, number, [string | number, string]");
                else {
                    if (typeof a[1] !== "string")
                        throw new Error("Expected a[1] to be a string");
                    if (typeof a[0] !== "string" && typeof a[0] !== "number")
                        throw new Error("Expected a[0] to be one of string, number");
                }
            return a;
        }
        it("Simple union: Throw when a different type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, true)).to.throw("Expected a to be one of string, number, [string | number, string]");
            (0, chai_1.expect)((0, utils_1.call)(test, test)).to.throw("Expected a to be one of string, number, [string | number, string]");
            (0, chai_1.expect)((0, utils_1.call)(test, {})).to.throw("Expected a to be one of string, number, [string | number, string]");
        });
        it("Simple union: Not throw when a value of the right type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "Hello")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, [33, "World"])).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, 12)).to.not.throw();
        });
        function test1(a) {
            if (typeof a !== "object" || a === null)
                throw new Error("Expected a to be one of BMember, CMember, AMember");
            else {
                if (a.kind !== 1)
                    if (a.kind !== 2)
                        if (a.kind !== 0)
                            throw new Error("Expected a to be one of BMember, CMember, AMember");
                        else {
                            if (typeof a.value !== "string")
                                throw new Error("Expected a.value to be a string");
                        }
                    else {
                        if (typeof a.value !== "boolean")
                            throw new Error("Expected a.value to be a boolean");
                    }
                else {
                    if (typeof a.value !== "number")
                        throw new Error("Expected a.value to be a number");
                }
            }
            return a;
        }
        it("Discriminated union: Throw when a different type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test1, { kind: 0, value: 123 })).to.throw("Expected a.value to be a string");
            (0, chai_1.expect)((0, utils_1.call)(test1, { kind: 1, value: true })).to.throw("Expected a.value to be a number");
            (0, chai_1.expect)((0, utils_1.call)(test1, {})).to.throw("Expected a to be one of BMember, CMember, AMember");
        });
        it("Discriminated union: Not throw when a value of the right type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test1, { kind: 0, value: "hello" })).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test1, { kind: 2, value: false })).to.not.throw();
        });
        function test2(a) {
            if (typeof a !== "string")
                if (!Array.isArray(a))
                    if (typeof a !== "object" || a === null)
                        throw new Error("Expected a to be one of string, BMember, AMember, (AMember | BMember)[]");
                    else {
                        if (a.kind !== 1)
                            if (a.kind !== 0)
                                throw new Error("Expected a to be one of string, BMember, AMember, (AMember | BMember)[]");
                            else {
                                if (typeof a.value !== "string")
                                    throw new Error("Expected a.value to be a string");
                            }
                        else {
                            if (typeof a.value !== "number")
                                throw new Error("Expected a.value to be a number");
                        }
                    }
                else {
                    for (let i_1 = 0; i_1 < a.length; i_1++) {
                        if (typeof a[i_1] !== "object" || a[i_1] === null)
                            throw new Error("Expected a[" + i_1 + "] to be one of BMember, AMember");
                        else {
                            if (a[i_1].kind !== 1)
                                if (a[i_1].kind !== 0)
                                    throw new Error("Expected a[" + i_1 + "] to be one of BMember, AMember");
                                else {
                                    if (typeof a[i_1].value !== "string")
                                        throw new Error("Expected a[" + i_1 + "].value to be a string");
                                }
                            else {
                                if (typeof a[i_1].value !== "number")
                                    throw new Error("Expected a[" + i_1 + "].value to be a number");
                            }
                        }
                    }
                }
            return a;
        }
        it("Complex union: Throw when a different type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { kind: 0, value: 123 })).to.throw("Expected a.value to be a string");
            (0, chai_1.expect)((0, utils_1.call)(test2, { kind: 2, value: true })).to.throw("Expected a to be one of string, BMember, AMember, (AMember | BMember)[]");
            (0, chai_1.expect)((0, utils_1.call)(test2, [123])).to.throw("Expected a[0] to be one of BMember, AMember");
        });
        it("Complex union: Not throw when a value of the right type is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, { kind: 0, value: "hello" })).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test2, "hello")).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test2, [])).to.not.throw();
        });
    });
});
