import type { Assert, Cmp } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("Cmp", () => {
    describe("Assert", () => {

        function test(a: Assert<Cmp<string, "$self.startsWith(\"Hello\")">>) {
            return a;
        }

        it("Throw when the value does not satisfy the type", () => {
            expect(call(test, "Hellur World!")).to.throw("Expected a to satisfy `$self.startsWith(\"Hello\")`.");
        });
    
        it("Not throw when the value does not satisfy the type", () => {
            expect(call(test, "Hello!")).to.not.throw();
        });

        function test2(b: Assert<Cmp<number, "$self === 5", true>>, c: Assert<Cmp<Array<string>, "$self.length > 10", true>>) {
            return [b, c];
        }

        it("Throw when the type doesn't match", () => {
            expect(call(test2, "Some str")).to.throw("Expected b to be number.");
            expect(call(test2, 5, ["a", "b", "c", 33])).to.throw("Expected c[3] to be string.");
            expect(call(test2, 5, ["a", "b", "c"])).to.throw("Expected c to satisfy `$self.length > 10`.");
        });

        it("Not throw when the type matches", () => {
            expect(call(test2, 5, ["a", "b", "c", "d", "e", "f", "g", "h", "j", "p", "m"])).to.not.throw();
        });
    
    });
});