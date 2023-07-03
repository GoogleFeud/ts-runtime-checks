import type { Assert } from "../../dist/index";
import { expect } from "chai";
import { call } from "../utils";

interface User {
    friends?: User[],
    name: string,
    id: number
}

declare function is<T, _M = { __marker: "is" }>(prop: unknown) : prop is T;

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

});