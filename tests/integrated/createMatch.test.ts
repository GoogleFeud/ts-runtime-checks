/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { Matches, MinLen } from "../../dist";

declare function createMatch<R, U = unknown, _M = { __$marker: "createMatch" }>(fns: ((val: any) => R)[]) : (val: U) => R;

enum Values {
    String,
    Number,
    Bool
}

interface StringVal {
    kind: Values.String,
    value: string
}

interface NumberVal {
    kind: Values.Number,
    value: number
}

interface BooleanVal {
    kind: Values.Bool,
    value: boolean
}

type Val = StringVal | NumberVal | BooleanVal;

describe("Create Match function", () => {
    
    it("Match the values correctly", () => {
        const resolver = createMatch<string>([
            (date: Date) => date.toString(),
            (num: number | string | boolean) => num.toString(),
            ({value}: {value: string}) => value,
            (arr: Array<string> | Array<number>) => arr.join(", "),
            (arr: Array<Date>) => arr.map(i => i.toString()).join(", "),
            () => "UNKNOWN"
        ]);

        expect(resolver(123)).to.string("123");
        expect(resolver("hello")).to.string("hello");
        expect(resolver([1, 2, 3])).to.string("1, 2, 3");
        expect(resolver(["a", 1, "c"])).to.string("UNKNOWN");
        expect(resolver(new Date())).to.not.be.string("UNKNOWN");
        expect(resolver({ value: "123"})).to.be.string("123");
        expect(resolver({value: 123 })).to.be.string("UNKNOWN");
    });

    it("Match the Checks correctly", () => {
        const resolver: (val: unknown) => string = createMatch<string>([
            (str: string & MinLen<5>) => "str with minLen",
            (str: string & Matches<"/abc/">) => "str with matches",
            (str: string | number) => "str",
            (arr: Array<string> & MinLen<1>) => arr.map(val => resolver(val)).join(", "),
            (val: unknown) => `UNKNOWN: ${val}`
        ]);

        expect(resolver("abc")).to.be.string("str with matches");
        expect(resolver("abcdefesdd")).to.be.string("str with minLen");
        expect(resolver("ade")).to.be.string("str");
        expect(resolver(["a", "abc", "addddddddd"])).to.be.string("str, str with matches, str with minLen");
        expect(resolver(123)).to.be.string("str");
        expect(resolver([])).to.be.string("UNKNOWN: ");
        expect(resolver(["a", "abc", 123])).to.be.string("UNKNOWN: a,abc,123");
    });

    it("Match the discriminated union correctly", () => {
        const resolver = createMatch<number, Val>([
            (str: StringVal) => str.value.length,
            (num: NumberVal) => num.value,
            (bool: BooleanVal) => bool.value === true ? 1 : 0,
            () => -1
        ]);

        expect(resolver({ kind: Values.String, value: "abc"})).to.be.equal(3);
        //@ts-expect-error Purposeful
        expect(resolver({ kind: Values.String, value: 123 })).to.be.equal(-1);
        expect(resolver({ kind: Values.Number, value: 123 })).to.be.equal(123);
        expect(resolver({ kind: Values.Bool, value: true })).to.be.equal(1);
    });

    it("Match literal types correctly", () => {
        const resolver = createMatch<number, string>([
            (str: "abc") => 1,
            (str: "bec") => 2,
            (str: "cek") => 3,
            () => -1
        ]);

        expect(resolver("abc")).to.be.equal(1);
        expect(resolver("cek")).to.be.equal(3);
        expect(resolver("abd")).to.be.equal(-1);
    });

    it("Match optional / nullable types correctly", () => {
        const resolver = createMatch<number>([
            (obj: { a?: number, b?: number }) => (obj.a || 0) + (obj.b || 0),
            (obj2: { c?: number, d?: number}) => (obj2.c|| 0) + (obj2.d || 0),
            () => -1
        ]);

        expect(resolver({a: 1, b: 1})).to.be.equal(2);
        expect(resolver({c: 1, d: 1})).to.be.equal(2);
        expect(resolver({a: 1, c: 1})).to.be.equal(-1);
        expect(resolver({b: 2, d: 1})).to.be.equal(-1);
        expect(resolver({a: 1, b: 2, c: 3, d: 4})).to.be.equal(3);
    });

});