"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const chai_1 = require("chai");
describe("Early return", () => {
    function test(a, b) {
        if (typeof a !== "string")
            return undefined;
        if (typeof b !== "number")
            return undefined;
        return true;
    }
    it("Return undefined when a parameter type is wrong", () => {
        (0, chai_1.expect)((0, utils_1.call)(test, "Hello", "World")()).to.be.equal(undefined);
        (0, chai_1.expect)((0, utils_1.call)(test, "Hello", 123)()).to.be.equal(true);
    });
});
