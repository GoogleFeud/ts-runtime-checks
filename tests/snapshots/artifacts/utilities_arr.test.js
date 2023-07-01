"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Arr", () => {
    describe("Arr<{length}>", () => {
        function test(a) {
            if (!Array.isArray(a) || a.length !== 6)
                throw new Error("Expected a to be an array, to have a length of 6");
            const len_1 = a.length;
            for (let i_1 = 0; i_1 < len_1; i_1++) {
                if (typeof a[i_1] !== "string" || a[i_1].length !== 4)
                    throw new Error("Expected a[" + i_1 + "] to be a string, to have a length of 4");
            }
            return a;
        }
        it("Throw when the correct length is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["aaaa", "bbbb", "cccc", "dddddd"])).to.throw("Expected a to be an array, to have a length of 6");
        });
        it("Throw when the inner type is not validated correctly", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["aaaa", "bbbb", "cccc", "dddddd", "eeee", "mmmm"])).to.throw("Expected a[3] to be a string, to have a length of 4");
        });
        it("Not throw when the correct length is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, ["aaaa", "bbbb", "cccc", "dddd", "eeee", "mmmm"])).to.not.throw();
        });
    });
    describe("Arr<{minLen}>", () => {
        function test(a) {
            if (!Array.isArray(a) || a.length < 3)
                throw new Error("Expected a to be an array, to have a length greater than 3");
            const len_2 = a.length;
            for (let i_2 = 0; i_2 < len_2; i_2++) {
                if (typeof a[i_2] !== "number")
                    throw new Error("Expected a[" + i_2 + "] to be a number");
            }
            return a;
        }
        it("Throw when the correct length is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2])).to.throw("Expected a to be an array, to have a length greater than 3");
        });
        it("Not throw when the correct length is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3, 4, 5])).to.not.throw();
        });
    });
    describe("Arr<{maxLen}>", () => {
        function test(a) {
            if (!Array.isArray(a) || a.length > 6)
                throw new Error("Expected a to be an array, to have a length less than 6");
            const len_3 = a.length;
            for (let i_3 = 0; i_3 < len_3; i_3++) {
                if (typeof a[i_3] !== "number")
                    throw new Error("Expected a[" + i_3 + "] to be a number");
            }
            return a;
        }
        it("Throw when the correct length is not provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).to.throw("Expected a to be an array, to have a length less than 6");
        });
        it("Not throw when the correct length is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, [1, 2, 3, 4, 5])).to.not.throw();
        });
    });
});
