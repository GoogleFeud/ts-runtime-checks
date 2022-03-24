import { Assert } from "../../../src/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("test", () => {
    function test(a: Assert<string>) {
        return a;
    }
    expect(test("hello")).to.be.equal("hello");
    expect(call(test, 12)).to.throw("Expected a to be string.");
});