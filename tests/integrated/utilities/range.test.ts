import type { Assert, Range } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Range", () => {
    describe("Assert", () => {
        describe("In function parameters", () => {
            function test(a: Assert<Range<1, 5>>) {
                return a;
            }
    
            it("Throw when the number is outside of the range", () => {
                expect(call(test, 12)).to.throw("Expected a to be Range<1, 5>.");
            });
    
            it("Not throw when the number is in range", () => {
                expect(call(test, 3)).to.not.throw();
            });
    
            it("Throw when the provided value is not a number", () => {
                expect(call(test, "abc")).to.throw("Expected a to be Range<1, 5>.");
                expect(call(test)).to.throw("Expected a to be Range<1, 5>.");
            });
    
            function test2(a: Assert<Range<number, 30>>) {
                return a;
            }
    
            it("Not throw when only a max is specified", () => {
                expect(call(test2, -44)).to.not.throw();
                expect(call(test2, 123)).to.throw("Expected a to be Range<number, 30>.");
            });

            function test3(a: Assert<Range<-30, number>>) {
                return a;
            }
    
            it("Not throw when only a min is specified", () => {
                expect(call(test3, 12233)).to.not.throw();
                expect(call(test3, -44)).to.throw("Expected a to be Range<-30, number>.");
            });
    
        });
    });
});