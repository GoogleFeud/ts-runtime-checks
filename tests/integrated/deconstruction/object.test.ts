import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Object deconstruction", () => {

    describe("Assert", () => {
        function test({a, b}: Assert<{a: number, b: string, c: Array<string>}>) {
            return [a, b];
        }

        describe("In function parameters", () => {
            it("Throw when one of the deconstructed properties has a wrong type", () => {
                expect(call(test, {a: "Hello", b: "..."})).to.throw("Expected a to be number.");
            });
    
            it("Not throw when a non-deconstructed property has a wrong type", () => {
                expect(call(test, {a: 123, b: "123", c: 123})).to.not.throw();
            });

        });

    });
});