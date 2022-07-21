import type { Assert, ExactProps } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Exact Props", () => {
    describe("Assert", () => {

        function test(a: Assert<ExactProps<{a: string, b: number, c?: string}>>) {
            return a;
        }

        it("Throw when there are excessive properties", () => {
            expect(call(test, {a: "a", b: 234, d: 33})).to.throw("Property a.d is excessive.");
        });
    
        it("Not throw when there aren't excessive properties", () => {
            expect(call(test, {a: "a", b: 2345, c: "b"})).to.not.throw();
        });
    
        function test2(a: Assert<ExactProps<{a: {b: string}}>>) {
            return a;
        }
    
        it("Throw when there are excessive nested properties", () => {
            expect(call(test2, { a: { b: "c2", c: 12 }})).to.throw("Property a.a.c is excessive.");
        });

        it("Not throw when there are excessive nested properties", () => {
            expect(call(test2, { a: { b: "c2" }})).to.not.throw();
        });

        function test3(a: Assert<{a: string, b: ExactProps<{c: number}>}>) { 
            return a;
        }

        it("Not throw when there are excessive properties", () => {
            expect(call(test3, {a: "123", d: 123, b: { c: 123 }})).to.not.throw();
        });

        it("Throw when there are excessive properties", () => {
            expect(call(test3, {a: "123", d: 123, b: { d: 32 }})).to.throw("Property a.b.d is excessive.");
        });
    
    });
        
});