import type { Assert, Arr, Str } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Arr", () => {
    describe("Arr<{length}>", () => {
        function test(a: Assert<Arr<Str<{ length: 4 }>, {
            length: 6
        }>>) {
            return a;
        }

        it("Throw when the correct length is not provided", () => {
            expect(call(test, ["aaaa", "bbbb", "cccc", "dddddd"])).to.throw("Expected a to be an array, to have a length of 6");
        });

        it("Throw when the inner type is not validated correctly", () => {
            expect(call(test, ["aaaa", "bbbb", "cccc", "dddddd", "eeee", "mmmm"])).to.throw("Expected a[3] to be a string, to have a length of 4");
        });

        it("Not throw when the correct length is provided", () => {
            expect(call(test, ["aaaa", "bbbb", "cccc", "dddd", "eeee", "mmmm"])).to.not.throw();
        });
    
    });

    describe("Arr<{minLen}>", () => {
        function test(a: Assert<Arr<number, {
            minLen: 3
        }>>) {
            return a;
        }

        it("Throw when the correct length is not provided", () => {
            expect(call(test, [1, 2])).to.throw("Expected a to be an array, to have a length greater than 3");
        });

        it("Not throw when the correct length is provided", () => {
            expect(call(test, [1, 2, 3, 4, 5])).to.not.throw();
        });
    
    });

    describe("Arr<{maxLen}>", () => {
        function test(a: Assert<Arr<number, {
            maxLen: 6
        }>>) {
            return a;
        }

        it("Throw when the correct length is not provided", () => {
            expect(call(test, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).to.throw("Expected a to be an array, to have a length less than 6");
        });

        it("Not throw when the correct length is provided", () => {
            expect(call(test, [1, 2, 3, 4, 5])).to.not.throw();
        });
    
    });

});