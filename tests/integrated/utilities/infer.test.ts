import type { Assert, Infer } from "../../../dist/index";
import { expect } from "chai";

describe("Infer", () => {
    describe("Assert", () => {
        function test<A, B>(a: Assert<Infer<A>, false>, b: Assert<{
            a: number,
            b: Infer<B>
        }, false>) {
            return true;
        }

        it("Return true", () => {
            expect(test("abc", {
                a: 123,
                b: 456
            })).to.be.equal(true);
        });

        it("Return false", () => {
            expect(test(123, {
                //@ts-expect-error error
                a: "abc",
                b: false
            })).to.be.equal(false);
        });
    
    });
});