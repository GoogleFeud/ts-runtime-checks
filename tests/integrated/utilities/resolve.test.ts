import type { Assert, Resolve } from "../../../dist/index";
import { expect } from "chai";

describe("Resolve", () => {
    describe("Assert", () => {
        function test<A, B>(a: Assert<Resolve<A>, false>, b: Assert<{
            a: number,
            b: Resolve<B>
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
            expect(test("abc", {
                //@ts-expect-error error
                a: "abc",
                b: 456
            })).to.be.equal(false);
        });
    
    });
});