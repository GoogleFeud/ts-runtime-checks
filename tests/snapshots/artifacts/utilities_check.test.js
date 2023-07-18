"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("Check", () => {
    describe("Assert", () => {
        function test(a) {
            if (typeof a !== "number" || a < 5 || a > 15)
                throw new Error("Expected a to be a number, to be greater than 5, to be less than 15");
            return a;
        }
        it("Combine different checks", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, 6)).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, 13)).to.not.throw();
            (0, chai_1.expect)((0, utils_1.call)(test, 3)).to.throw("Expected a to be a number, to be greater than 5, to be less than 15");
        });
        function test1(a) {
            if (typeof a !== "object" || a === null)
                return false;
            const { two: two_1, one: one_1 } = a;
            if (typeof two_1 !== "object" || two_1 === null || Object.keys(two_1).length !== 3 || typeof two_1.a !== "string" || typeof two_1.b !== "number" || typeof two_1.c !== "boolean" || !Array.isArray(one_1))
                return false;
            for (let i_1 = 0; i_1 < one_1.length; i_1++) {
                if (typeof one_1[i_1] !== "string" || one_1[i_1].length > 6)
                    return false;
            }
            return true;
        }
        it("Combine checks inside object", () => {
            console.log((0, utils_1.call)(test1, {
                one: ["abc"],
                two: { a: "abc", b: 123, c: false }
            })());
            (0, chai_1.expect)((0, utils_1.call)(test1, {
                one: ["abc"],
                two: { a: "abc", b: 123, c: false }
            })()).to.equal(true);
            (0, chai_1.expect)((0, utils_1.call)(test1, {
                one: ["abccccccccc"],
                two: { a: "a", b: 123, c: true }
            })()).to.equal(false);
            (0, chai_1.expect)((0, utils_1.call)(test1, {
                one: ["abcc"],
                two: { a: "a", b: 123, c: true, d: false }
            })()).to.equal(false);
        });
    });
});
