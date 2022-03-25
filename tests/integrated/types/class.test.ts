
import type { Assert } from "../../../dist/index";
import { call } from "../../utils";
import { expect } from "chai";

class Test {}
class Test2 {}

describe("Class", () => {
    describe("Assert", () => {
        function test(a: Assert<Test>, b: Assert<Test & Test2>) {
            return [a, b];
        }

        describe("In function parameters", () => {
    
            it("Not throw when the right class is provided", () => {
                expect(call(test, new Test(), new Test2())).to.not.throw();
            });

            it("Throw when wrong class is provided", () => {
                expect(call(test, new Test2(), new Test())).to.throw("Expected a to be Test.");
            });

        });

    });
});