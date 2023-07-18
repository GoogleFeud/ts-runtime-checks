import type { Assert, Max, MaxLen, Min, Check } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Check", () => {
    describe("Assert", () => {
        function test(a: Assert<number & Min<5> & Max<15>>) {
            return a;
        }

        it("Combine different checks", () => {
            expect(call(test, 6)).to.not.throw();
            expect(call(test, 13)).to.not.throw();
            expect(call(test, 3)).to.throw("Expected a to be a number, to be greater than 5, to be less than 15");
        });

        type AmountOfProps<T extends number> = Check<`Object.keys($self).length === ${T}`, `to have exactly ${T} keys`>;

        function test1(a: Assert<{
            one: (string & MaxLen<6>)[],
            two: { a: string, b: number, c: boolean} & AmountOfProps<3>
        }, false>) {
            return true;
        }

        it("Combine checks inside object", () => {
            console.log(call(test1, {
                one: ["abc"],
                two: { a: "abc", b: 123, c: false}
            })());
            expect(call(test1, {
                one: ["abc"],
                two: { a: "abc", b: 123, c: false}
            })()).to.equal(true);
            expect(call(test1, {
                one: ["abccccccccc"],
                two: {a: "a", b: 123, c: true }
            })()).to.equal(false);
            expect(call(test1, {
                one: ["abcc"],
                two: { a: "a", b: 123, c: true, d: false }
            })()).to.equal(false);
        });
    
    });
});