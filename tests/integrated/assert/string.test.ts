import { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Assert", () => {
    describe("<string>", () => {
        it("Throw when a string is not provided", () => {
            function test(a: Assert<string>) {
                return a;
            }
            expect(test("hello")).to.be.equal("hello");
            expect(call(test, 12)).to.throw("Expected a to be string.");
        });

        it("Not throw when the string is optional and not provided", () => {
            function test(a?: Assert<string>) {
                return a;
            }
            expect(test()).to.be.undefined;
            expect(test("abc")).to.be.equal("abc");
            expect(call(test, 12)).to.throw("Expected a to be string.");
        });
    });
});