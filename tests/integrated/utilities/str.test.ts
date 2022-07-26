import type { Assert, Str } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Str", () => {
    describe("Str<{matches}>", () => {
        function test(a: Assert<Str<{
            matches: "/foo*/g"
        }>>) {
            return a;
        }
        it("Throw when the regex doesn't match", () => {
            expect(call(test, "hello")).to.throw("Expected a to be a string and to match /foo*/g.");
        });
    
        it("Not throw when the regex matches", () => {
            expect(call(test, "soccer is not football")).to.not.throw();
        });
    
        it("Throw when the provided value is not string", () => {
            expect(call(test, 12)).to.throw("Expected a to be a string and to match /foo*/g.");
            expect(call(test)).to.throw("Expected a to be a string and to match /foo*/g.");
        });
    
        function test2(a: Assert<Str<{
            matches: ""
        }>>) {
            return a;
        }
    
        it("Check only if the parameter is a string, if regex is not provided", () => {
            expect(call(test2, "hello")).to.not.throw();
            expect(call(test2, 123)).to.throw("Expected a to be a string.");
        });
    
    });

    describe("Str<{length}>", () => {
        function test(a: Assert<Str<{
            length: 32
        }>>) {
            return a;
        }

        it("Throw when the length doesn't match", () => {
            expect(call(test, "hello")).to.throw("Expected a to be a string and to have a length of 32.");
        });
    
        it("Not throw when the regex matches", () => {
            expect(call(test, "a".repeat(32))).to.not.throw();
        });
    
    });

    describe("Str<{matches, length}>", () => {
        function test(a: Assert<Str<{
            length: 12,
            matches: "/foo*/g"
        }>>) {
            return a;
        }

        it("Throw when the length doesn't match", () => {
            expect(call(test, "foofoo")).to.throw("Expected a to be a string, to have a length of 12 and to match /foo*/g.");
        });
    
        it("Not throw when the regex matches", () => {
            expect(call(test, "foo".repeat(4))).to.not.throw();
        });
    
    });

    describe("Str<{minLen}>", () => {
        function test(a: Assert<Str<{
            minLen: 6
        }>>) {
            return a;
        }

        it("Throw when the correct length is not provided", () => {
            expect(call(test, "abede")).to.throw("Expected a to be a string and to have a minimum length of 6.");
        });

        it("Not throw when the correct length is provided", () => {
            expect(call(test, "abcdewdwdw")).to.not.throw();
        });
    
    });

    describe("Str<{maxLen}>", () => {
        function test(a: Assert<Str<{
            maxLen: 9
        }>>) {
            return a;
        }

        it("Throw when the correct length is not provided", () => {
            expect(call(test, "abwdwdwdwdwdwdwdwdwdwdwdwdwd")).to.throw("Expected a to be a string and to have a maximum length of 9.");
        });

        it("Not throw when the correct length is provided", () => {
            expect(call(test, "abcde")).to.not.throw();
        });
    
    });
});