import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Object deconstruction", () => {

    describe("Assert", () => {
        function test({a, b}: Assert<{a: number, b: string, c: Array<string>}>) {
            return [a, b];
        }

        function test2({a, d: {c}}: Assert<{a: number, d: { c: 123 }}>) {
            return [a, c];
        }

        it("Throw when one of the deconstructed properties has a wrong type", () => {
            expect(call(test, {a: "Hello", b: "..."})).to.throw("Expected a to be number.");
        });
    
        it("Not throw when a non-deconstructed property has a wrong type", () => {
            expect(call(test, {a: 123, b: "123", c: 123})).to.not.throw();
        });

        it("Throw when one of the nested deconstructed properties has a wrong type", () => {
            expect(call(test2, {a: 123, d: { c: 456}})).to.throw("Expected c to be 123.");
        });
    
        it("Not throw when a nested non-deconstructed property has a wrong type", () => {
            expect(call(test2, {a: 123, d: { c: 123, b: 345 }})).to.not.throw();
        });

    });

});