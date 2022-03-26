import type { Assert, CmpKey, Var } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("CmpKey", () => {
    describe("Assert", () => {
        describe("In function parameters", () => {
            function test(a: Assert<CmpKey<{a: number}, "a", 3.14>>) {
                return a;
            }

            it("Throw when the key doesn't equal the value", () => {
                expect(call(test, { a: 314 })).to.throw("Expected a.a to be 3.14.");
            });

            it("Not throw when the right value is provided", () => {
                expect(call(test, { a: 3.14 })).to.not.throw();
            });

            function test2(a: Assert<CmpKey<{a: string|number }, "a", "a"|"b"|123>>) {
                return a;
            }

            it("Throw when the key doesn't equal any of the value's types", () => {
                expect(call(test2, { a: "c" })).to.throw("Expected a.a to be 123 | \"a\" | \"b\".");
                expect(call(test2, { a: 123 })).to.not.throw();
                expect(call(test2, { a: "b" })).to.not.throw();
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const someVar = 3001;
            function test3(a: Assert<CmpKey<{ b: number }, "b", Var<"someVar">>>) {
                return a;
            }

            it("Throw when the property doesn't equal variable value", () => {
                expect(call(test3, { b: 3002 })).to.throw("Expected a.b to be Var<\"someVar\">.");
            });

            function test4(a: Assert<CmpKey<{a: string, b: number}, "a", "abc", true>>) {
                return a;
            }
    
            it("Throw when some of the types of the object's properties are incorrect with the correct others option", () => {
                expect(call(test4, {a: "abc", b: "bce"})).to.throw("Expected a.b to be number.");
            });
    
        });
    });
});