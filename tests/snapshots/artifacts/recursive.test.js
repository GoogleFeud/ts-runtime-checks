"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils_1 = require("../utils");
describe("Recursive data structures", () => {
    function test1(user) {
        function user_1(param_1) { if (typeof param_1 !== "object" || param_1 === null)
            return false; const { friends: friends_1 } = param_1; if (typeof param_1.name !== "string" || typeof param_1.id !== "number")
            return false; if (friends_1 !== undefined) {
            if (!Array.isArray(friends_1))
                return false;
            const len_1 = friends_1.length;
            for (let i_1 = 0; i_1 < len_1; i_1++) {
                if (!user_1(friends_1[i_1]))
                    return false;
            }
            ;
        } return true; }
        if (!user_1(user))
            throw new Error("Expected user to be User");
        return true;
    }
    it("Throw when the recursive data is incorrect", () => {
        (0, chai_1.expect)((0, utils_1.call)(test1, {
            name: "abc",
            id: 123,
            friends: [0]
        })).to.throw("Expected user to be User");
    });
    it("Return false when the recursive data is incorrect", () => {
        const value_1 = {
            name: "123",
            id: 456,
            friends: [{ name: "456", id: 123 }, 4]
        };
        function value_2(param_2) { if (typeof param_2 !== "object" || param_2 === null)
            return false; const { friends: friends_2 } = param_2; if (typeof param_2.name !== "string" || typeof param_2.id !== "number")
            return false; if (friends_2 !== undefined) {
            if (!Array.isArray(friends_2))
                return false;
            const len_2 = friends_2.length;
            for (let i_2 = 0; i_2 < len_2; i_2++) {
                if (!value_2(friends_2[i_2]))
                    return false;
            }
            ;
        } return true; }
        (0, chai_1.expect)(value_2(value_1)).to.be.equal(false);
        const value_3 = {
            name: "123",
            id: 456,
            friends: 123
        };
        function value_4(param_3) { if (typeof param_3 !== "object" || param_3 === null)
            return false; const { friends: friends_3 } = param_3; if (typeof param_3.name !== "string" || typeof param_3.id !== "number")
            return false; if (friends_3 !== undefined) {
            if (!Array.isArray(friends_3))
                return false;
            const len_3 = friends_3.length;
            for (let i_3 = 0; i_3 < len_3; i_3++) {
                if (!value_4(friends_3[i_3]))
                    return false;
            }
            ;
        } return true; }
        (0, chai_1.expect)(value_4(value_3)).to.be.equal(false);
        const value_5 = {
            name: "123",
            id: 456,
            friends: [{ name: "456", id: 123, friends: [] }]
        };
        function value_6(param_4) { if (typeof param_4 !== "object" || param_4 === null)
            return false; const { friends: friends_4 } = param_4; if (typeof param_4.name !== "string" || typeof param_4.id !== "number")
            return false; if (friends_4 !== undefined) {
            if (!Array.isArray(friends_4))
                return false;
            const len_4 = friends_4.length;
            for (let i_4 = 0; i_4 < len_4; i_4++) {
                if (!value_6(friends_4[i_4]))
                    return false;
            }
            ;
        } return true; }
        (0, chai_1.expect)(value_6(value_5)).to.be.equal(true);
    });
});
