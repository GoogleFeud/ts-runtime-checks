import { run, bench, group } from "mitata";

const arr = Array.from({length: 10000}, (i: number) => i + 1);

group("For loops", () => {

    bench("Reverse while loop", () => {
        let i = arr.length;
        while(i--) {
            const data = arr[i];
            if (typeof data === "number") continue;
        }
    });


    bench("Default for loop", () => {
        for (let i=0; i < arr.length; i++) {
            const data = arr[i];
            if (typeof data === "number") continue;
        }
    });

    bench(".every", () => {
        const data = arr.every(n => typeof n === "number");
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

const obj: Array<{a?: number, b: string, c: boolean}> = Array.from({length: 1000}, (i: number) => ({a: i, b: "string", c: true}));
group("Object deletion", () => {

    bench("Set to undefined", () => {
        for (let i=0; i < obj.length; i++) {
            obj[i].a = undefined;
        }
    });

    
    bench("Delete keyword", () => {
        for (let i=0; i < obj.length; i++) {
            delete obj[i].a;
        }
    });

});

group("Checking if an object is an array", () => {
    
    bench("constructor", () => {
        return arr.constructor === Array;
    });

    bench("instanceof Array", () => {
        return arr instanceof Array;
    });

    bench("Array.isArray", () => {
        return Array.isArray(arr);
    });

});

(async () => {
    run();
})();