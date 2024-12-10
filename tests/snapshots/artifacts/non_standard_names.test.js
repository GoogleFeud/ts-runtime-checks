"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils_1 = require("../utils");
describe("Non-Standard names", () => {
    function test(value) {
        if (typeof value !== "object" || value === null)
            throw new Error("Expected value to be an object");
        if (typeof value["non-standard-name"] !== "number")
            throw new Error("Expected value.non-standard-name to be a number");
        if (typeof value.value !== "string")
            throw new Error("Expected value.value to be a string");
        return value;
    }
    it("Correctly validate property with non-standard name", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, { "non-standard-name": "abc", value: "abc" })).to.throw("Expected value.non-standard-name to be a number");
    });
    function test2(value) {
        if (typeof value !== "object" || value === null)
            throw new Error("Expected value to be an object");
        const { "non-standard": non_standard_1 } = value;
        if (typeof non_standard_1 !== "object" || non_standard_1 === null)
            throw new Error("Expected value.non-standard to be an object");
        const { arr: arr_1, values: values_1 } = non_standard_1;
        if (!Array.isArray(arr_1))
            throw new Error("Expected value.non-standard.arr to be an array<number>");
        for (let i_1 = 0; i_1 < arr_1.length; i_1++) {
            if (typeof arr_1[i_1] !== "number")
                throw new Error("Expected value.non-standard.arr[" + i_1 + "] to be a number");
        }
        if (!Array.isArray(values_1))
            throw new Error("Expected value.non-standard.values to be an array<string>");
        for (let i_2 = 0; i_2 < values_1.length; i_2++) {
            if (typeof values_1[i_2] !== "string")
                throw new Error("Expected value.non-standard.values[" + i_2 + "] to be a string");
        }
        return value;
    }
    it("Correctly binds non-standard names", () => {
        (0, chai_1.expect)((0, utils_1.call)(test2, { "non-standard": {
                arr: [1, 2, "abc"],
                values: []
            } })).to.throw("Expected value.non-standard.arr[2] to be a number");
    });
});
