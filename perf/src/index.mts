import { run, bench, group } from "mitata";

const arr = Array.from({length: 10000}, (i: number) => i + 1);

group("For loops", () => {

    bench("Reverse while loop", () => {
        let i = arr.length;
        while(i--) {
            const data = arr[i];
            if (data === 3100) return true;
        }
    });


    bench("Default for loop", () => {
        for (let i=0; i < arr.length; i++) {
            const data = arr[i];
            if (data === 3100) return true;
        }
    });
});

const tuple = [1, "abc", true];

group("Tuple checks", () => {

    bench("If chain", () => {
        if (!(tuple instanceof Array) || tuple.length !== 3) return false;
        if (typeof tuple[0] !== "number") return false;
        if (typeof tuple[1] !== "string") return false;
        if (typeof tuple[2] !== "boolean") return false;
        return true;
    });

    
    bench("Without conditions", () => {
        return tuple instanceof Array && tuple.length === 3 && typeof tuple[0] === "number" && typeof tuple[1] === "string" && tuple[2] === "boolean";
    });

});

const obj = { a: 123, b: "abc", c: false, d: 456 };
group("Object properties checks", () => {

    bench("For in loop", () => {
        for (const key in obj) {
            if (key !== "a" && key !== "b" && key !== "c" && key !== "d") return false;
        }
        return true;
    });

});

(async () => {
    run();
})();