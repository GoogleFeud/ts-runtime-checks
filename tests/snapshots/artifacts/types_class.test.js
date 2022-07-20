"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
class Test {
}
class Test2 {
}
describe("Class", () => {
    describe("Assert", () => {
        function test(a, b) {
            if (!(a instanceof Test))
                throw new Error("Expected a to be an instance of Test.");
            if (typeof b !== "object")
                throw new Error("Expected b to be Test & Test2.");
            return [a, b];
        }
        it("Not throw when the right class is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, new Test(), new Test2())).to.not.throw();
        });
        it("Throw when wrong class is provided", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, new Test2(), new Test())).to.throw("Expected a to be an instance of Test.");
        });
    });
});
