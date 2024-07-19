import type { Assert, Max, MaxLen, Min, Check, MinLen } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

type StartsWith<T extends string> = Check<`$self.startsWith("${T}")`, `to start with "${T}"`, "startsWith", T>;
type AmountOfProps<T extends number> = Check<`Object.keys($self).length === ${T}`, `to have exactly ${T} keys`>;

describe("Check", () => {
    describe("Assert", () => {
        function test(a: Assert<number & Min<5> & Max<15>>) {
            return a;
        }

        it("Combine different checks", () => {
            expect(call(test, 6)).to.not.throw();
            expect(call(test, 13)).to.not.throw();
            expect(call(test, 3)).to.throw("Expected a to be a number, to be greater than 5 & to be less than 15");
        });

        function test1(a: Assert<{
            one: (string & MaxLen<6>)[],
            two: { a: string, b: number, c: boolean} & AmountOfProps<3>
        }, false>) {
            return true;
        }

        it("Combine checks inside object", () => {
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

        function test2(a: Assert<string & MinLen<3> | number & Min<3>, false>) {
            return true;
        }

        it("Conditional checks between different types", () => {
            expect(call(test2, "abcdef")()).to.equal(true);
            expect(call(test2, 5)()).to.equal(true);
            expect(call(test2, "ab")()).to.equal(false);
            expect(call(test2, 1)()).to.equal(false);
        });
    
        function test3(a: Assert<string & (MaxLen<3> | StartsWith<"a">), false>) {
            return true;
        }

        it("Conditional checks between the same type", () => {
            expect(call(test3, "de")()).to.equal(true);
            expect(call(test3, "abcdef")()).to.equal(true);
            expect(call(test3, "efeew3e")()).to.equal(false);
            expect(call(test3, 123)()).to.equal(false);
        });
    });
});