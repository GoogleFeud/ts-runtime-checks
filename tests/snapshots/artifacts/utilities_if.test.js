"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const chai_1 = require("chai");
describe("If", () => {
    describe("Assert", () => {
        function test(a) {
            if (!a.startsWith("Hello"))
                throw new Error("Expected a to satisfy \"$self.startsWith(\"Hello\")\"");
            return a;
        }
        it("Throw when the value does not satisfy the type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "Hellur World!")).to.throw("Expected a to satisfy \"$self.startsWith(\"Hello\")\"");
        });
        it("Not throw when the value does not satisfy the type", () => {
            (0, chai_1.expect)((0, utils_1.call)(test, "Hello!")).to.not.throw();
        });
        function test2(b, c) {
            if (typeof b !== "number")
                throw new Error("Expected b to be a number");
            if (b !== 5)
                throw new Error("Expected b to satisfy \"$self === 5\"");
            if (!(c instanceof Array))
                throw new Error("Expected c to be an array");
            if (c.length < 10)
                throw new Error("Expected c to satisfy \"$self.length > 10\"");
            for (let i_1 = 0; i_1 < c.length; i_1++) {
                if (typeof c[i_1] !== "string")
                    throw new Error("Expected c[" + i_1 + "] to be a string");
            }
            return [b, c];
        }
        it("Throw when the type doesn't match", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, "Some str")).to.throw("Expected b to be a number");
            (0, chai_1.expect)((0, utils_1.call)(test2, 5, ["a", "b", "c", 33])).to.throw("Expected c to satisfy \"$self.length > 10\"");
            (0, chai_1.expect)((0, utils_1.call)(test2, 5, ["a", "b", "c"])).to.throw("Expected c to satisfy \"$self.length > 10\"");
        });
        it("Not throw when the type matches", () => {
            (0, chai_1.expect)((0, utils_1.call)(test2, 5, ["a", "b", "c", "d", "e", "f", "g", "h", "j", "p", "m"])).to.not.throw();
        });
    });
});
