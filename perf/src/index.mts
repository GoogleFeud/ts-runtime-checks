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

(async () => {
    run();
})();