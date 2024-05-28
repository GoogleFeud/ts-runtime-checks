"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const stringToNum = (str) => {
    return +str;
};
const numToString = (num) => {
    return num.toString();
};
const incrementArr = (arr) => {
    return arr.map((value) => {
        return value + 1;
    });
};
describe("Transformations", () => {
    it("Simple transform (no validation)", () => {
        const value_1 = { fieldA: "abc", fieldB: "33", fieldC: "2" };
        let result_1;
        result_1 = {};
        const temp_1 = stringToNum(value_1.fieldC);
        result_1.fieldC = temp_1 * 2;
        result_1.fieldA = value_1.fieldA;
        if (value_1.fieldB !== undefined)
            if (typeof value_1.fieldB === "string") {
                result_1.fieldB = stringToNum(value_1.fieldB);
            }
            else
                result_1.fieldB = value_1.fieldB;
        (0, chai_1.expect)(result_1).to.be.deep.equal({ fieldA: "abc", fieldB: 33, fieldC: 4 });
    });
    it("Simple transform (validation)", () => {
        const performTransform = (values) => {
            return () => {
                const value_2 = values;
                let result_2;
                if (typeof value_2 !== "object" || value_2 === null)
                    throw new Error("Expected value to be an object");
                result_2 = {};
                if (typeof value_2.fieldC !== "string")
                    throw new Error("Expected value.fieldC to be a string");
                const temp_2 = stringToNum(value_2.fieldC);
                result_2.fieldC = temp_2 * 2;
                if (typeof value_2.fieldA !== "string")
                    throw new Error("Expected value.fieldA to be a string");
                result_2.fieldA = value_2.fieldA;
                if (value_2.fieldB !== undefined)
                    if (typeof value_2.fieldB === "string") {
                        result_2.fieldB = stringToNum(value_2.fieldB);
                    }
                    else
                        throw new Error("Expected value.fieldB to be one of string | undefined");
                return result_2;
            };
        };
        (0, chai_1.expect)(performTransform(123)).to.throw("Expected value to be an object");
        (0, chai_1.expect)(performTransform({ fieldA: 123, fieldB: "123", fieldC: "1" })).to.throw("Expected value.fieldA to be a string");
        (0, chai_1.expect)(performTransform({ fieldA: "123", fieldB: "12", fieldC: "1" })()).to.be.deep.equal({ fieldA: "123", fieldB: 12, fieldC: 2 });
        (0, chai_1.expect)(performTransform({ fieldA: "123", fieldC: "1" })()).to.be.deep.equal({ fieldA: "123", fieldC: 2 });
        (0, chai_1.expect)(performTransform({ fieldA: "123", fieldB: "12", fieldC: true })).to.throw("Expected value.fieldC to be a string");
    });
    it("Complex transform (no validation)", () => {
        const value_3 = { fieldA: "12", fieldB: 3 };
        let result_3;
        result_3 = {};
        if (typeof value_3.fieldA === "string") {
            const temp_3 = stringToNum(value_3.fieldA);
            result_3.fieldA = numToString(temp_3 + 1);
        }
        else if (typeof value_3.fieldA === "number") {
            result_3.fieldA = numToString(value_3.fieldA);
        }
        else
            result_3.fieldA = value_3.fieldA;
        if (typeof value_3.fieldB === "number" && value_3.fieldB <= 3) {
            const temp_4 = numToString(value_3.fieldB);
            result_3.fieldB = temp_4.repeat(2);
        }
        else if (typeof value_3.fieldB === "number" && value_3.fieldB === 10) {
            const temp_5 = numToString(value_3.fieldB);
            result_3.fieldB = temp_5.repeat(2);
        }
        else
            result_3.fieldB = value_3.fieldB;
        if (typeof value_3.fieldC === "string" && /[0-9]+/.test(value_3.fieldC)) {
            const temp_6 = stringToNum(value_3.fieldC);
            result_3.fieldC = temp_6 + 1;
        }
        else if (typeof value_3.fieldC === "string" && /\b[^\d\W]+\b/g.test(value_3.fieldC)) {
            result_3.fieldC = value_3.fieldC.repeat(2);
        }
        else {
            result_3.fieldC = 1;
        }
        (0, chai_1.expect)(result_3).to.be.deep.equal({ fieldA: "13", fieldB: "33", fieldC: 1 });
        const value_4 = { fieldA: "17", fieldB: 10, fieldC: "abc" };
        let result_4;
        result_4 = {};
        if (typeof value_4.fieldA === "string") {
            const temp_7 = stringToNum(value_4.fieldA);
            result_4.fieldA = numToString(temp_7 + 1);
        }
        else if (typeof value_4.fieldA === "number") {
            result_4.fieldA = numToString(value_4.fieldA);
        }
        else
            result_4.fieldA = value_4.fieldA;
        if (typeof value_4.fieldB === "number" && value_4.fieldB <= 3) {
            const temp_8 = numToString(value_4.fieldB);
            result_4.fieldB = temp_8.repeat(2);
        }
        else if (typeof value_4.fieldB === "number" && value_4.fieldB === 10) {
            const temp_9 = numToString(value_4.fieldB);
            result_4.fieldB = temp_9.repeat(2);
        }
        else
            result_4.fieldB = value_4.fieldB;
        if (typeof value_4.fieldC === "string" && /[0-9]+/.test(value_4.fieldC)) {
            const temp_10 = stringToNum(value_4.fieldC);
            result_4.fieldC = temp_10 + 1;
        }
        else if (typeof value_4.fieldC === "string" && /\b[^\d\W]+\b/g.test(value_4.fieldC)) {
            result_4.fieldC = value_4.fieldC.repeat(2);
        }
        else {
            result_4.fieldC = 1;
        }
        (0, chai_1.expect)(result_4).to.be.deep.equal({ fieldA: "18", fieldB: "1010", fieldC: "abcabc" });
    });
    it("Complex transform (validation)", () => {
        const performTransform = (values) => {
            return () => {
                const value_5 = values;
                let result_5;
                if (typeof value_5 !== "object" || value_5 === null)
                    throw new Error("Expected value to be ConditionalTransform");
                result_5 = {};
                if (typeof value_5.fieldA === "string") {
                    const temp_11 = stringToNum(value_5.fieldA);
                    result_5.fieldA = numToString(temp_11 + 1);
                }
                else if (typeof value_5.fieldA === "number") {
                    result_5.fieldA = numToString(value_5.fieldA);
                }
                else
                    throw new Error("Expected value.fieldA to be one of string | number");
                if (typeof value_5.fieldB === "number" && value_5.fieldB <= 3) {
                    const temp_12 = numToString(value_5.fieldB);
                    result_5.fieldB = temp_12.repeat(2);
                }
                else if (typeof value_5.fieldB === "number" && value_5.fieldB === 10) {
                    const temp_13 = numToString(value_5.fieldB);
                    result_5.fieldB = temp_13.repeat(2);
                }
                else
                    throw new Error("Expected value.fieldB to be one of number, to be less than 3 | number, to be equal to 10");
                if (typeof value_5.fieldC === "string" && /[0-9]+/.test(value_5.fieldC)) {
                    const temp_14 = stringToNum(value_5.fieldC);
                    result_5.fieldC = temp_14 + 1;
                }
                else if (typeof value_5.fieldC === "string" && /\b[^\d\W]+\b/g.test(value_5.fieldC)) {
                    result_5.fieldC = value_5.fieldC.repeat(2);
                }
                else {
                    result_5.fieldC = 1;
                }
                return result_5;
            };
        };
        (0, chai_1.expect)(performTransform({ fieldA: true, fieldB: 3 })).to.throw("Expected value.fieldA to be one of string | number");
        (0, chai_1.expect)(performTransform({ fieldA: "30", fieldB: "ab" })).to.throw("Expected value.fieldB to be one of number, to be less than 3 | number, to be equal to 10");
        (0, chai_1.expect)(performTransform({ fieldA: "30", fieldB: 1, fieldC: "123" })()).to.be.deep.equal({ fieldA: "31", fieldB: "11", fieldC: 124 });
    });
    it("Array transform (validation)", () => {
        const performTransform = (values) => {
            return () => {
                const value_6 = values;
                let result_6;
                if (typeof value_6 !== "object" || value_6 === null)
                    throw new Error("Expected value to be an object");
                result_6 = {};
                if (!Array.isArray(value_6.fieldA))
                    throw new Error("Expected value.fieldA to be an array<number>");
                for (let i_1 = 0; i_1 < value_6.fieldA.length; i_1++) {
                    if (typeof value_6.fieldA[i_1] !== "number")
                        throw new Error("Expected value.fieldA[" + i_1 + "] to be a number");
                }
                result_6.fieldA = incrementArr(value_6.fieldA);
                if (value_6.fieldB !== undefined) {
                    if (!Array.isArray(value_6.fieldB))
                        throw new Error("Expected value.fieldB to be an array<number, to be less than 3 | number, to be equal to 10>");
                    result_6.fieldB = [];
                    for (let i_2 = 0; i_2 < value_6.fieldB.length; i_2++) {
                        if (typeof value_6.fieldB[i_2] === "number" && value_6.fieldB[i_2] <= 3) {
                            result_6.fieldB[i_2] = value_6.fieldB[i_2] + 1;
                        }
                        else if (typeof value_6.fieldB[i_2] === "number" && value_6.fieldB[i_2] === 10) {
                            result_6.fieldB[i_2] = value_6.fieldB[i_2] - 1;
                        }
                        else
                            throw new Error("Expected value.fieldB[" + i_2 + "] to be one of number, to be less than 3 | number, to be equal to 10");
                    }
                }
                return result_6;
            };
        };
        (0, chai_1.expect)(performTransform({ fieldA: [1, 2, 3], fieldB: [2, 1, 10] })()).to.be.deep.equal({ fieldA: [2, 3, 4], fieldB: [3, 2, 9] });
        (0, chai_1.expect)(performTransform({ fieldA: [1, 2, 6], fieldB: [2, 10, 4] })).to.throw("Expected value.fieldB[2] to be one of number, to be less than 3 | number, to be equal to 10");
        (0, chai_1.expect)(performTransform({ fieldA: [1, 2, 1] })()).to.be.deep.equal({ fieldA: [2, 3, 2] });
    });
});
