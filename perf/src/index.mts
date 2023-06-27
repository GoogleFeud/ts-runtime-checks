/* eslint-disable @typescript-eslint/no-empty-function */
import { run, bench, group } from "mitata";
import { Assert, ErrorMsg } from "../../dist/index.js";

type ToBeValidated = {
    name: string,
    id: number,
    other: "test",
    tuple: [string, number, [string, number, true]]
}

function test_minimized(obj: Assert<ToBeValidated, false>) {
    return true;
}

function test_optimized(obj) {
    const cond_1 = obj.other !== "test", cond_2 = typeof obj.name !== "string", cond_3 = typeof obj.id !== "number";
    if (cond_1 || cond_2 || cond_3)
        return false;
    const cond_4 = !Array.isArray(obj.tuple), cond_5 = typeof obj.tuple[0] !== "string", cond_6 = typeof obj.tuple[1] !== "number";
    if (cond_4 || cond_5 || cond_6)
        return false;
    const cond_7 = !Array.isArray(obj.tuple[2]), cond_8 = obj.tuple[2][2] !== true, cond_9 = typeof obj.tuple[2][0] !== "string";
    if (cond_7 || cond_8 || cond_9)
        return false;
    const cond_10 = typeof obj.tuple[2][1] !== "number";
    if (cond_10)
        return false;
    return true;
}

function test_lots_of_ifs(obj: Assert<ToBeValidated, ErrorMsg>) {
    return true;
}

const object: ToBeValidated = {
    name: "abc",
    id: 123,
    other: "test",
    tuple: ["a", 123, ["b", 123, true]]
};

group("If vs Minimized", () => {
    
    bench("Minimized", () => {
        const result = test_minimized(object);
    });

    bench("If", () => {
        const result = test_lots_of_ifs(object);
    });

});

group("Optimized vs Minimized", () => {

    bench("Optimized", () => {
        const result = test_optimized(object);
    });

    bench("Minimized", () => {
        const result = test_minimized(object);
    });

});

(async () => {
    run();
})();