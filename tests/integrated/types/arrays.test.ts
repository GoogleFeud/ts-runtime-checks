import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Array", () => {
    describe("Assert", () => {
        function test(a: Assert<Array<number>>) {
            return a;
        }

        it("Throw when one of the values is not of the type", () => {
            expect(call(test, [1, 2, 3, 4, 5, "x"])).to.throw("Expected a[5] to be a number");
        });
    
        it("Not throw when all of the values are of the same type", () => {
            expect(call(test, [1, 2, 3, 4, 5])).to.not.throw();
            expect(call(test, [])).to.not.throw();
        });


    });
});