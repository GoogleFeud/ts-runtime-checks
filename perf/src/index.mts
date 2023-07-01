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

await run();