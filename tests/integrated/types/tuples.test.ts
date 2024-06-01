import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Tuple", () => {
    describe("Assert", () => {
        function test(a: Assert<[string, "123", number?]>) {
            return a;
        }

        it("Throw when one of the values is undefined", () => {
            expect(call(test, ["abc"])).to.throw("Expected a[1] to be \"123\"");
        });

        it("Throw when the tuple is not provided", () => {
            expect(call(test)).to.throw("Expected a to be [string, \"123\", undefined | number]");
        });
    
        it("Throw when one of the values has a wrong type", () => {
            expect(call(test, ["abc", "123", "Hello"])).to.throw("Expected a[2] to be undefined | number");
            expect(call(test, ["abc", 123, "Hello"])).to.throw("Expected a[1] to be \"123\"");
            expect(call(test, [Symbol(), "123", "Hello"])).to.throw("Expected a[0] to be a string");
        });

        it("Not throw when all the types are correct", () => {
            expect(call(test, ["Hello", "123"])).to.not.throw();
            expect(call(test, ["Hello", "123", 444])).to.not.throw();
        });

    });

});