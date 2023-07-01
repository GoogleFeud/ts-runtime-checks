import { run, bench, group } from "mitata";
import { Assert, ErrorMsg, ExactProps } from "../../dist/index.js";

type ToBeValidated = {
    name: string,
    id: number,
    other: "test",
    tuple: [string, number, [string, number, true]],
    obj: ExactProps<{
        test1: string,
        test2: number[]
    }, true>
}

function test_minimized(obj: Assert<ToBeValidated, false>) {
    return true;
}

function test_lots_of_ifs(obj: Assert<ToBeValidated, ErrorMsg>) {
    return true;
}

const object: ToBeValidated = {
    name: "abc",
    id: 123,
    other: "test",
    tuple: ["a", 123, ["b", 123, true]],
    obj: {
        test1: "abc",
        test2: [1, 2, 3]
    }
};

group("If vs AND/OR", () => {

    bench("AND/OR", () => {
        const result = test_minimized(object);
    });

    bench("If", () => {
        const result = test_lots_of_ifs(object);
    });

});

const array = Array.from({length: 100000}, (_, i) => i + 1);

group("For vs every", () => {

    
    bench("Every", () => {
        const result = array.every(el => typeof el === "number");
    });
    
    bench("For", () => {
        let result = true;
        for (let i=0; i < array.length; i++) {
            if (typeof array[i] !== "number") {
                result = false;
                break;
            }
        }
    });

});

const obj = { a: 123, b: 123, c: 456 };
group("in vs undefined", () => {

    bench("in", () => {
        const r = "a" in obj;
    });

    bench("undefined", () => {
        const r = obj.a !== undefined;
    });

});

(async () => {
    run();
})();