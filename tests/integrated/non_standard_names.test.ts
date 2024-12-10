import type { Assert } from "../../dist/index";
import { expect } from "chai";
import { call } from "../utils";

export type NonStandardObject = {
    "non-standard-name": number,
    value: string
}

export type LargeNonStandardObject = {
    "non-standard": {
        arr: number[],
        values: string[]
    }
}

describe("Non-Standard names", () => {

    function test(value: Assert<NonStandardObject>) {
        return value;
    }
    
    it("Correctly validate property with non-standard name", () => {
        expect(call(test, { "non-standard-name": "abc", value: "abc" })).to.throw("Expected value.non-standard-name to be a number");
    });

    function test2(value: Assert<LargeNonStandardObject>) {
        return value;
    }

    it("Correctly binds non-standard names", () => {
        expect(call(test2, { "non-standard": {
            arr: [1, 2, "abc"],
            values: []
        }})).to.throw("Expected value.non-standard.arr[2] to be a number");
    });

});