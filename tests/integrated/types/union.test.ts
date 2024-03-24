import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

const enum Members {
    A,
    B,
    C
}

interface AMember {
    kind: Members.A,
    value: string
}

interface BMember {
    kind: Members.B,
    value: number
}

interface CMember {
    kind: Members.C,
    value: boolean
}

type SomeMember = AMember | BMember | CMember;

describe("Unions", () => {
    describe("Assert", () => {
        function test(a: Assert<string|number|[string|number, string]>) {
            return a;
        }

        it("Simple union: Throw when a different type is provided", () => {
            expect(call(test, true)).to.throw("Expected a to be one of string, number, [string | number, string]");
            expect(call(test, test)).to.throw("Expected a to be one of string, number, [string | number, string]");
            expect(call(test, {})).to.throw("Expected a to be one of string, number, [string | number, string]");
        });
    
        it("Simple union: Not throw when a value of the right type is provided", () => {
            expect(call(test, "Hello")).to.not.throw();
            expect(call(test, [33, "World"])).to.not.throw();
            expect(call(test, 12)).to.not.throw();
        });

        function test1(a: Assert<SomeMember>) {
            return a;
        }

        it("Discriminated union: Throw when a different type is provided", () => {
            expect(call(test1, { kind: Members.A, value: 123})).to.throw("Expected a.value to be a string");
            expect(call(test1, { kind: Members.B, value: true})).to.throw("Expected a.value to be a number");
            expect(call(test1, {})).to.throw("Expected a to be one of CMember, BMember, AMember");
        });

        it("Discriminated union: Not throw when a value of the right type is provided", () => {
            expect(call(test1, { kind: Members.A, value: "hello"})).to.not.throw();
            expect(call(test1, { kind: Members.C, value: false})).to.not.throw();
        });

        function test2(a: Assert<
                AMember |
                BMember |
                (AMember | BMember)[] |
                string
            >) {
            return a;
        }

        it("Complex union: Throw when a different type is provided", () => {
            expect(call(test2, { kind: Members.A, value: 123})).to.throw("Expected a.value to be a string");
            expect(call(test2, { kind: Members.C, value: true})).to.throw("Expected a to be one of string, BMember, AMember, (AMember | BMember)[]");
            expect(call(test2, [123])).to.throw("Expected a[0] to be one of BMember, AMember");
        });

        
        it("Complex union: Not throw when a value of the right type is provided", () => {
            expect(call(test2, { kind: Members.A, value: "hello"})).to.not.throw();
            expect(call(test2, "hello")).to.not.throw();
            expect(call(test2, [])).to.not.throw();
        });

    });

});