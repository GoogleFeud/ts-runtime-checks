import type { Assert, Matches, Max, MaxLen, Min, MinLen } from "../../../dist/index";
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
            })).to.throw("Expected a.b to be undefined | number");
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

        function test2(a: Assert<Record<string & MinLen<3>, number>>) {
            return true;
        }

        it("Throw when key is wrong (Record)", () => {
            expect(call(test2, { a: 123, [2]: 34})).to.throw("Expected key 2 of a to have a length greater than 3");
        });

        function test3(a: Assert<{
            [key: number & Min<3>]: string,
            [key: string & Matches<"/abc/g">]: number
        }>) {
            return true;
        }

        it("Throw when there are multiple index types", () => {
            expect(call(test3, {
                [4]: "abc",
                [5]: "hello",
                abs123: "a",
                other: "3"
            })).to.throw("Expected key abs123 of a to match /abc/g");
        });

    });

});