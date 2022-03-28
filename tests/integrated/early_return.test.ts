import type { EarlyReturn } from "../../dist/index";
import { call } from "../utils";
import { expect } from "chai";

describe("Early return", () => {
    
    function test(a: EarlyReturn<string>, b: EarlyReturn<number>) : boolean | undefined {
        return true;
    }

    it("Return undefined when a parameter type is wrong", () => {
        expect(call(test, "Hello", "World")()).to.be.equal(undefined);
        expect(call(test, "Hello", 123)()).to.be.equal(true);
    });

});