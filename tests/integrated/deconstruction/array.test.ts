import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Array deconstruction", () => {

    describe("Assert", () => {
        function test([a, b]: Assert<Array<string>>, [c, d]: Assert<[number, string, boolean]>) {
            return [a, b, c, d];
        }

        describe("In function parameters", () => {
            it("Throw when one of the deconstructed properties has a wrong type", () => {
                expect(call(test, ["a", 123], [123, "abc"])).to.throw("Expected b to be string.");
                expect(call(test, ["a", "b"], ["abc", "abc"])).to.throw("Expected c to be number.");
            });
    
            it("Not throw when a non-deconstructed property has a wrong type", () => {
                expect(call(test, ["a", "b", 123], [1, "2", "3"])).to.not.throw();
            });

        });

    });
});