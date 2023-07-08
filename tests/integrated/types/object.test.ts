import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

interface Test {
    a: string,
    b?: number
}

describe("Object", () => {
    describe("Assert", () => {
        function test(a: Assert<Test & { c: Array<string> }>) {
            return a;
        }

        it("Throw when one of the properties has the wrong type", () => {
            expect(call(test, {
                a: "ABC",
                c: 123
            })).to.throw("Expected a.c to be an array");
            expect(call(test, {
                a: "ABC",
                b: "adc",
                c: 123
            })).to.throw("Expected a.b to be a number");
            expect(call(test, {
                a: "ABC",
                b: 123,
                c: [1]
            })).to.throw("Expected a.c[0] to be a string");
        });
    
        it("Not throw when all of the values are of the same type", () => {
            expect(call(test, {
                a: "ABC",
                b: 123,
                c: ["Hello"]
            })).to.not.throw();
        });

    });

});