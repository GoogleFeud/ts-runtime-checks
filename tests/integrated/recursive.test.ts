import type { Assert } from "../../dist/index";
import { expect } from "chai";
import { call } from "../utils";

interface User {
    friends?: User[],
    name: string,
    id: number
}

interface Value<T> {
    val1?: Value<string>,
    val2?: Value<T>,
    value: T
}

declare function is<T, _M = { __$marker: "is" }>(prop: unknown) : prop is T;

describe("Recursive data structures", () => {

    function test1(user: Assert<User>) {
        return true;
    }

    it("Throw when the recursive data is incorrect", () => {
        expect(call(test1, {
            name: "abc",
            id: 123,
            friends: [0]
        })).to.throw("Expected user to be User");
    });

    it("Return false when the recursive data is incorrect", () => {
        expect(is<User>({
            name: "123",
            id: 456,
            friends: [{name: "456", id: 123}, 4]
        })).to.be.equal(false);
        expect(is<User>({
            name: "123",
            id: 456,
            friends: [{name: "456", id: 123, friends: []}]
        })).to.be.equal(true);
    });

    it("Return false when the recursive data with type parameter is incorrect", () => {
        expect(is<Value<number>>({
            val1: { value: "abc", val2: { value: "def" } },
            val2: { value: 123 },
            value: 123
        })).to.be.equal(true);
    });

});