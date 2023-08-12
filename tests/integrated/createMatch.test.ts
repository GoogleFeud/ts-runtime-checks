import { expect } from "chai";

declare function createMatch<R, U = unknown, _M = { __$marker: "createMatch" }>(fns: ((val: any) => R)[]) : (val: U) => R;

describe("Create Match function", () => {
    
    it("Map the values correctly", () => {
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

});