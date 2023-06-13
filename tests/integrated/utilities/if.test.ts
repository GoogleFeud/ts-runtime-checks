import type { Assert, If } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

describe("If", () => {
    describe("Assert", () => {

        function test(a: Assert<If<string, "$self.startsWith(\"Hello\")">>) {
            return a;
        }

        it("Throw when the value does not satisfy the type", () => {
            expect(call(test, "Hellur World!")).to.throw("Expected a to satisfy \"$self.startsWith(\"Hello\")\"");
        });
    
        it("Not throw when the value does not satisfy the type", () => {
            expect(call(test, "Hello!")).to.not.throw();
        });

        function test2(b: Assert<If<number, "$self === 5", true>>, c: Assert<If<Array<string>, "$self.length > 10", true>>) {
            return [b, c];
        }

        it("Throw when the type doesn't match", () => {
            expect(call(test2, "Some str")).to.throw("Expected b to be a number");
            expect(call(test2, 5, ["a", "b", "c", 33])).to.throw("Expected c to satisfy \"$self.length > 10\"");
            expect(call(test2, 5, ["a", "b", "c"])).to.throw("Expected c to satisfy \"$self.length > 10\"");
        });

        it("Not throw when the type matches", () => {
            expect(call(test2, 5, ["a", "b", "c", "d", "e", "f", "g", "h", "j", "p", "m"])).to.not.throw();
        });
    
    });
});