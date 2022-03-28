import type { Assert, Matches } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Matches", () => {
    describe("Assert", () => {
        function test(a: Assert<Matches<"/foo*/g">>) {
            return a;
        }
        it("Throw when the regex doesn't match", () => {
            expect(call(test, "hello")).to.throw("Expected a to be Matches<\"/foo*/g\">.");
        });
    
        it("Not throw when the regex matches", () => {
            expect(call(test, "soccer is not football")).to.not.throw();
        });
    
        it("Throw when the provided value is not string", () => {
            expect(call(test, 12)).to.throw("Expected a to be Matches<\"/foo*/g\">.");
            expect(call(test)).to.throw("Expected a to be Matches<\"/foo*/g\">.");
        });
    
        function test2(a: Assert<Matches<string>>) {
            return a;
        }
    
        it("Check only if the parameter is a string, if regex is not provided", () => {
            expect(call(test2, "hello")).to.not.throw();
            expect(call(test2, 123)).to.throw("Expected a to be Matches<string>.");
        });
    
    });
});