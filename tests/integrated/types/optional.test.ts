import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Optional / nullable parameters", () => {
    function test(c: Assert<number>, a?: Assert<string>, b?: Assert<[string, string, number?]>) {
        return [a, b, c];
    }

    it("Not throw when optional parameters are not provided", () => {
        expect(call(test, 12)).to.not.throw();
    });

    it("Not throw when optional parameters are provided", () => {
        expect(call(test, 12, "abc", ["a", "b"])).to.not.throw();
        expect(call(test, 12, "abc", ["a", "b", 12])).to.not.throw();
    });
});