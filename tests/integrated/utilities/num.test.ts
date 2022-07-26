import type { Assert, Num } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Num", () => {
    describe("Num{min, max}", () => {
        function test(a: Assert<Num<{min: 1, max: 5}>>) {
            return a;
        }
    
        it("Throw when the number is outside of the range", () => {
            expect(call(test, 12)).to.throw("Expected a to be a number, to be greater than 1 and to be less than 5.");
        });
    
        it("Not throw when the number is in range", () => {
            expect(call(test, 3)).to.not.throw();
        });
    
        it("Throw when the provided value is not a number", () => {
            expect(call(test, "abc")).to.throw("Expected a to be a number, to be greater than 1 and to be less than 5.");
            expect(call(test)).to.throw("Expected a to be a number, to be greater than 1 and to be less than 5.");
        });
    
        function test2(a: Assert<Num<{max: 30}>>) {
            return a;
        }
    
        it("Not throw when only a max is specified", () => {
            expect(call(test2, -44)).to.not.throw();
            expect(call(test2, 123)).to.throw("Expected a to be a number and to be less than 30.");
        });

        function test3(a: Assert<Num<{min: -30}>>) {
            return a;
        }
    
        it("Not throw when only a min is specified", () => {
            expect(call(test3, 12233)).to.not.throw();
            expect(call(test3, -44)).to.throw("Expected a to be a number and to be greater than -30.");
        });
    
    });
});