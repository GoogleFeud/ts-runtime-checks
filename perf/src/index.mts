/* eslint-disable @typescript-eslint/no-unused-vars */
import { run, bench, group } from "mitata";
import Tsrc from "../../dist/index.js";

type ToTest = Array<number>;

const numbers = Array.from({length: 10}, (_, i) => i + 1);

group("Array<number>", () => {
    bench("typebox", () => {
        function check_Array_95_Number(value) {
            return (Array.isArray(value) && value.every(function (value) { return (typeof value === "number"); }));
        }
        function check1(value) {
            return check_Array_95_Number(value);
        }

        const result = check1(numbers);
    });

    bench("tsrc", () => {
        const result = Tsrc.is<ToTest>(numbers);
    });

});

const value_1 = {
    A: { a: 123, b: 456, c: 789 },
    B: { a: 22123, b: 42356, c: 72389 },
    C: { a: 12213, b: 422156, c: 789212 }
};

group("Minified union vs Non-minified union", () => {

    bench("Non-minified", () => {
        const r = (() => {
            if (typeof value_1 !== "object" || value_1 === null)
                return false;
            const { A: A_1, B: B_1, C: C_1 } = value_1;
            if (A_1 !== undefined) {
                if (typeof A_1 !== "object" || A_1 === null)
                    return false;
                if (typeof A_1.a !== "number")
                    return false;
                if (typeof A_1.b !== "number")
                    return false;
                if (typeof A_1.c !== "number")
                    return false;
            }
            if (B_1 !== undefined) {
                if (typeof B_1 !== "object" || B_1 === null)
                    return false;
                if (typeof B_1.a !== "number")
                    return false;
                if (typeof B_1.b !== "number")
                    return false;
                if (typeof B_1.c !== "number")
                    return false;
            }
            if (C_1 !== undefined) {
                if (typeof C_1 !== "object" || C_1 === null)
                    return false;
                if (typeof C_1.a !== "number")
                    return false;
                if (typeof C_1.b !== "number")
                    return false;
                if (typeof C_1.c !== "number")
                    return false;
            }
            return true;
        })();
    });

    
    bench("Minified", () => {
        const r = (() => {
            if (typeof value_1 !== "object" || value_1 === null)
                return false;
            const { A: A_1, B: B_1, C: C_1 } = value_1;
            return (!(A_1 !== undefined ? typeof A_1 !== "object" || A_1 === null || typeof A_1.a !== "number" || typeof A_1.b !== "number" || typeof A_1.c !== "number" : false)) && (!(B_1 !== undefined ? typeof B_1 !== "object" || B_1 === null || typeof B_1.a !== "number" || typeof B_1.b !== "number" || typeof B_1.c !== "number" : false)) && (!(C_1 !== undefined ? typeof C_1 !== "object" || C_1 === null || typeof C_1.a !== "number" || typeof C_1.b !== "number" || typeof C_1.c !== "number" : false));
        })();
    });
    
});

await run();