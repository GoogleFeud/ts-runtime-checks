"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
describe("Create Match function", () => {
    it("Map the values correctly", () => {
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
});
