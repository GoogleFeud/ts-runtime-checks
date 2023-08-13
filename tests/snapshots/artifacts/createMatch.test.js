"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
var Values;
(function (Values) {
    Values[Values["String"] = 0] = "String";
    Values[Values["Number"] = 1] = "Number";
    Values[Values["Bool"] = 2] = "Bool";
})(Values || (Values = {}));
describe("Create Match function", () => {
    it("Match the values correctly", () => {
        const resolver = value_1 => {
            if (typeof value_1 === "number") {
                return value_1.toString();
            }
            else if (typeof value_1 === "string") {
                return value_1.toString();
            }
            else if (Array.isArray(value_1)) {
                if (value_1.every(value_2 => typeof value_2 === "string"))
                    return value_1.join(", ");
                else if (value_1.every(value_3 => typeof value_3 === "number"))
                    return value_1.join(", ");
                else if (value_1.every(value_4 => (value_4 instanceof Date)))
                    return value_1.map(i => i.toString()).join(", ");
            }
            else if (typeof value_1 === "boolean") {
                if (value_1 === true)
                    return value_1.toString();
                else if (value_1 === false)
                    return value_1.toString();
            }
            else if (typeof value_1 === "object" && value_1 !== null && typeof value_1.value === "string") {
                let { value } = value_1;
                return value;
            }
            else if ((value_1 instanceof Date)) {
                return value_1.toString();
            }
            return "UNKNOWN";
        };
        (0, chai_1.expect)(resolver(123)).to.string("123");
        (0, chai_1.expect)(resolver("hello")).to.string("hello");
        (0, chai_1.expect)(resolver([1, 2, 3])).to.string("1, 2, 3");
        (0, chai_1.expect)(resolver(["a", 1, "c"])).to.string("UNKNOWN");
        (0, chai_1.expect)(resolver(new Date())).to.not.be.string("UNKNOWN");
        (0, chai_1.expect)(resolver({ value: "123" })).to.be.string("123");
        (0, chai_1.expect)(resolver({ value: 123 })).to.be.string("UNKNOWN");
    });
    it("Match the Checks correctly", () => {
        const resolver = value_5 => {
            if (typeof value_5 === "number") {
                return "str";
            }
            else if (typeof value_5 === "string") {
                if (value_5.length > 5)
                    return "str with minLen";
                else if (/abc/.test(value_5))
                    return "str with matches";
                else
                    return "str";
            }
            else if (Array.isArray(value_5) && value_5.every(value_6 => typeof value_6 === "string") && value_5.length > 1) {
                return value_5.map(val => resolver(val)).join(", ");
            }
            return `UNKNOWN: ${value_5}`;
        };
        (0, chai_1.expect)(resolver("abc")).to.be.string("str with matches");
        (0, chai_1.expect)(resolver("abcdefesdd")).to.be.string("str with minLen");
        (0, chai_1.expect)(resolver("ade")).to.be.string("str");
        (0, chai_1.expect)(resolver(["a", "abc", "addddddddd"])).to.be.string("str, str with matches, str with minLen");
        (0, chai_1.expect)(resolver(123)).to.be.string("str");
        (0, chai_1.expect)(resolver([])).to.be.string("UNKNOWN: ");
        (0, chai_1.expect)(resolver(["a", "abc", 123])).to.be.string("UNKNOWN: a,abc,123");
    });
    it("Match the discriminated union correctly", () => {
        const resolver = value_7 => {
            if (typeof value_7 === "object" && value_7 !== null) {
                if (value_7.kind === 0 && typeof value_7.value === "string")
                    return value_7.value.length;
                else if (value_7.kind === 1 && typeof value_7.value === "number")
                    return value_7.value;
                else if (value_7.kind === 2 && typeof value_7.value === "boolean")
                    return value_7.value === true ? 1 : 0;
            }
            return -1;
        };
        (0, chai_1.expect)(resolver({ kind: Values.String, value: "abc" })).to.be.equal(3);
        (0, chai_1.expect)(resolver({ kind: Values.String, value: 123 })).to.be.equal(-1);
        (0, chai_1.expect)(resolver({ kind: Values.Number, value: 123 })).to.be.equal(123);
        (0, chai_1.expect)(resolver({ kind: Values.Bool, value: true })).to.be.equal(1);
    });
    it("Match literal types correctly", () => {
        const resolver = value_8 => {
            if (typeof value_8 === "string") {
                if (value_8 === "abc")
                    return 1;
                else if (value_8 === "bec")
                    return 2;
                else if (value_8 === "cek")
                    return 3;
            }
            return -1;
        };
        (0, chai_1.expect)(resolver("abc")).to.be.equal(1);
        (0, chai_1.expect)(resolver("cek")).to.be.equal(3);
        (0, chai_1.expect)(resolver("abd")).to.be.equal(-1);
    });
    it("Match optional / nullable types correctly", () => {
        const resolver = value_9 => {
            if (typeof value_9 === "object" && value_9 !== null) {
                if (value_9.a !== undefined && typeof value_9.a === "number" && (value_9.b !== undefined && typeof value_9.b === "number"))
                    return (value_9.a || 0) + (value_9.b || 0);
                else if (value_9.c !== undefined && typeof value_9.c === "number" && (value_9.d !== undefined && typeof value_9.d === "number"))
                    return (value_9.c || 0) + (value_9.d || 0);
            }
            return -1;
        };
        (0, chai_1.expect)(resolver({ a: 1, b: 1 })).to.be.equal(2);
        (0, chai_1.expect)(resolver({ c: 1, d: 1 })).to.be.equal(2);
        (0, chai_1.expect)(resolver({ a: 1, c: 1 })).to.be.equal(-1);
        (0, chai_1.expect)(resolver({ b: 2, d: 1 })).to.be.equal(-1);
        (0, chai_1.expect)(resolver({ a: 1, b: 2, c: 3, d: 4 })).to.be.equal(3);
    });
});
