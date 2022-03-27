import type { Assert } from "../../dist/index";
import { call } from "../utils";
import { expect } from "chai";

describe("Type assertions (as)", () => {
    describe("Assert", () => {
        function test(a: Assert<Array<number>>, b: Assert<{a: number, b: string, c?: Array<string>, d: [string, symbol, number]}>) {
            return [a, b];
        }
        function test1(a: unknown, b: unknown) {
            return [a as Assert<Array<number>>, b as Assert<{a: number, b: string, c?: Array<string>, d: [string, symbol, number]}>];
        }

        it("No difference between parameter assertions and as assetions", () => {
            expect(call(test, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"]})).to.throw("Expected b.d[2] to be number.");
            expect(call(test1, [1, 2, 3], { a: 123, b: "abc", d: ["abc", Symbol(), "dec"]})).to.throw("Expected b.d[2] to be number.");
        });
    

    });
});