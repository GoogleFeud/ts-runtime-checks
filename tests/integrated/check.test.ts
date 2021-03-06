import { expect } from "chai";
import { Num } from "../../dist";

// Only way to test it :/
export declare function check<T, _M = { __marker: "check" }>(prop: unknown) : [T, Array<string>];

describe("Check function", () => {
    
    it("Return the correct value and errors", () => {
        const [, errs] = check<{a: number, b: string, c: { d: Num<{min: 1, max: 10}> }}>({
            a: 123,
            b: 456,
            c: {
                d: 44
            }
        });
        expect(errs[0]).to.be.equal("Expected value.b to be string.");
        expect(errs[1]).to.be.equal("Expected value.c.d to be a number, to be greater than 1 and to be less than 10.");
    });

});