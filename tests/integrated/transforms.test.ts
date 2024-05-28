import type { Max, Check, Transformed, Transform, ThrowError, Matches, Eq } from "../../dist/index";
import { expect } from "chai";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function transform<T, _ReturnType = unknown, _M = {__$marker: "transform"}>(value: T): Transformed<T>;

const stringToNum = (str: string) => +str;
const numToString = (num: number) => num.toString();

export type SimpleTransform = {
    fieldA: string,
    fieldB?: Transform<typeof stringToNum>,
    fieldC: Transform<[typeof stringToNum, "$self * 2"]>
}

export interface ConditionalTransform {
    /**
     * Either:
     * string -> turn to number, increment, turn back to string
     * number -> turn to string
     */
    fieldA: string & Transform<[typeof stringToNum, "$self + 1", typeof numToString]> | number & Transform<[typeof numToString]>,
    /**
     * Only transform the number if it's less than 3, OR if it's equal to 10
     */
    fieldB: (number & Max<3> | Eq<"10">) & Transform<[typeof numToString, "$self.repeat(2)"]>,
    /**
     * If the string matches "/[0-9]+/", turn it to a number and incrmenet it,
     * however, if it matches "/\\b[^\\d\\W]+\\b/g", repeat it,
     * otherwise, set the field to 1
     */
    fieldC: string & Matches<"/[0-9]+/"> & Transform<[typeof stringToNum, "$self + 1"]> | 
            string & Matches<"/\\b[^\\d\\W]+\\b/g"> & Transform<"$self.repeat(2)"> | 
            Transform<"1">
}

const incrementArr = (arr: Array<number>) => arr.map(value => value + 1);
 
export type ArraysTransform = {
    fieldA: Transform<typeof incrementArr>,
    fieldB?: Array<Max<3> & Transform<"$self + 1"> | number & Eq<"10"> & Transform<"$self - 1">>
}

describe("Transformations", () => {
    
    it("Simple transform (no validation)", () => {
        expect(transform<SimpleTransform>({ fieldA: "abc", fieldB: "33", fieldC: "2" })).to.be.deep.equal({fieldA: "abc", fieldB: 33, fieldC: 4});
    });

    it("Simple transform (validation)", () => {
        const performTransform = (values: unknown) => {
            return () => transform<SimpleTransform, ThrowError>(values as SimpleTransform);
        };

        expect(performTransform(123)).to.throw("Expected value to be an object");
        expect(performTransform({ fieldA: 123, fieldB: "123", fieldC: "1"})).to.throw("Expected value.fieldA to be a string");
        expect(performTransform({ fieldA: "123", fieldB: "12", fieldC: "1"})()).to.be.deep.equal({fieldA: "123", fieldB: 12, fieldC: 2});
        expect(performTransform({ fieldA: "123", fieldC: "1"})()).to.be.deep.equal({fieldA: "123", fieldC: 2});
        expect(performTransform({ fieldA: "123", fieldB: "12", fieldC: true})).to.throw("Expected value.fieldC to be a string");
    });

    it("Complex transform (no validation)", () => {
        expect(transform<ConditionalTransform>({ fieldA: "12", fieldB: 3 } as ConditionalTransform)).to.be.deep.equal({ fieldA: "13", fieldB: "33", fieldC: 1 });
        expect(transform<ConditionalTransform>({ fieldA: "17", fieldB: 10, fieldC: "abc" })).to.be.deep.equal({ fieldA: "18", fieldB: "1010", fieldC: "abcabc" });
    });

    it("Complex transform (validation)", () => {
        const performTransform = (values: unknown) => {
            return () => transform<ConditionalTransform, ThrowError>(values as ConditionalTransform);
        };

        expect(performTransform({ fieldA: true, fieldB: 3 })).to.throw("Expected value.fieldA to be one of string | number");
        expect(performTransform({ fieldA: "30", fieldB: "ab" })).to.throw("Expected value.fieldB to be one of number, to be less than 3 | number, to be equal to 10");
        expect(performTransform({ fieldA: "30", fieldB: 1, fieldC: "123" })()).to.be.deep.equal({ fieldA: "31", fieldB: "11", fieldC: 124 });
    });

    it("Array transform (validation)", () => {
        const performTransform = (values: unknown) => {
            return () => transform<ArraysTransform, ThrowError>(values as ArraysTransform);
        };

        expect(performTransform({ fieldA: [1, 2, 3], fieldB: [2, 1, 10] })()).to.be.deep.equal({ fieldA: [2, 3, 4], fieldB: [3, 2, 9]});
        expect(performTransform({ fieldA: [1, 2, 6], fieldB: [2, 10, 4] })).to.throw("Expected value.fieldB[2] to be one of number, to be less than 3 | number, to be equal to 10");
        expect(performTransform({ fieldA: [1, 2, 1] })()).to.be.deep.equal({ fieldA: [2, 3, 2] });
    });

});