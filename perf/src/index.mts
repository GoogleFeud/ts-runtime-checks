/* eslint-disable @typescript-eslint/no-unused-vars */
import { run, bench, group } from "mitata";
import Tsrc from "../../dist/index.js";

function random(array: unknown[]) {
    return array[Math.floor(Math.random()*array.length)];
}

interface ToBeChecked {
    number: number;
    negNumber: number;
    maxNumber: number;
    string: string;
    longString: string;
    boolean: boolean;
    deeplyNested: {
      foo: string;
      num: number;
      bool: boolean;
    };
  }

function validate_no_indirection(user: ToBeChecked) {
    if (typeof user !== "object" || user === null)
        return false;
    if (typeof user.number !== "number")
        return false;
    if (typeof user.negNumber !== "number")
        return false;
    if (typeof user.maxNumber !== "number")
        return false;
    if (typeof user.boolean !== "boolean")
        return false;
    if (typeof user.string !== "string")
        return false;
    if (typeof user.longString !== "string")
        return false;
    if (typeof user.deeplyNested !== "object" ||  user.deeplyNested === null)
        return false;
    if (typeof user.deeplyNested.num !== "number")
        return false;
    if (typeof user.deeplyNested.bool !== "boolean")
        return false;
    if (typeof user.deeplyNested.foo !== "string")
        return false;

    return true;
}

function validate_some_indirection(user: ToBeChecked) {
    if (typeof user !== "object" || user === null)
        return false;
    const {
        deeplyNested: deeplyNested_1
    } = user;
    if (typeof user.number !== "number")
        return false;
    if (typeof user.negNumber !== "number")
        return false;
    if (typeof user.maxNumber !== "number")
        return false;
    if (typeof user.boolean !== "boolean")
        return false;
    if (typeof user.string !== "string")
        return false;
    if (typeof user.longString !== "string")
        return false;
    if (typeof deeplyNested_1 !== "object" || deeplyNested_1 === null)
        return false;
    if (typeof deeplyNested_1.num !== "number")
        return false;
    if (typeof deeplyNested_1.bool !== "boolean")
        return false;
    if (typeof deeplyNested_1.foo !== "string")
        return false;

    return true;
}

function validate_all_indirection(user: ToBeChecked) {
    if (typeof user !== "object" || user === null)
        return false;
    const {
        deeplyNested: deeplyNested_1,
        number: number_1,
        negNumber: negNumber_1,
        maxNumber: maxNumber_1,
        boolean: boolean_1,
        string: string_1,
        longString: longString_1
    } = user;
    if (typeof number_1 !== "number")
        return false;
    if (typeof negNumber_1 !== "number")
        return false;
    if (typeof maxNumber_1 !== "number")
        return false;
    if (typeof boolean_1 !== "boolean")
        return false;
    if (typeof string_1 !== "string")
        return false;
    if (typeof longString_1 !== "string")
        return false;
    if (typeof deeplyNested_1 !== "object" || deeplyNested_1 === null)
        return false;
    const { num, bool, foo } = deeplyNested_1;
    if (typeof num !== "number")
        return false;
    if (typeof bool !== "boolean")
        return false;
    if (typeof foo !== "string")
        return false;

    return true;
}

const correctData1: ToBeChecked = {
    number: 123,
    maxNumber: Number.MAX_SAFE_INTEGER,
    negNumber: -1000,
    boolean: true,
    string: "abc",
    longString: "aaaaaaaaaaaaaaaaaaaaabc",
    deeplyNested: {
        num: 456,
        bool: false,
        foo: "def"
    }
};

const correctData2: ToBeChecked = {
    string: "def",
    number: 456,
    negNumber: -23828,
    longString: "wfkiefjeufheugfwygdwtdwgdwhefgeyfetfegtetgt",
    boolean: false,
    deeplyNested: {
        num: 456,
        bool: false,
        foo: "def"
    },
    maxNumber: Number.MAX_SAFE_INTEGER,
};

const incorrectData1 = {
    string: "abc",
    boolean: true,
    number: 456,
    longString: "wwdedwwdefefefrfdef",
    maxNumber: Number.MAX_SAFE_INTEGER,
    deeplyNested: {
        num: 2334,
        foo: true, // incorrect
        bool: false
    }
};

const allData = Array.from({ length: 3000 }, (_, i) => i % 2 === 0 ? [structuredClone(correctData1), structuredClone(incorrectData1), structuredClone(correctData2)] : [structuredClone(incorrectData1), structuredClone(correctData2), structuredClone(correctData1)]).flat();

group("Indirection", () => {
    bench("Some indirection", () => {
        for (const result of allData) {
            validate_some_indirection(result as ToBeChecked);
        }
    });

    bench("All Indirection", () => {
        for (const result of allData) {
            validate_all_indirection(result as ToBeChecked);
        }
    });

    bench("No indirection", () => {
        for (const result of allData) {
            validate_no_indirection(result as ToBeChecked);
        }
    });

});

function arr_deconstruction_partial(a) {
    if (typeof a !== "object" || a === null)
        return false;
    const { a: a_1 } = a;
    if (!Array.isArray(a_1))
        return false;
    const [, , t_1] = a_1;
    if (typeof a_1[1] !== "number")
        return false;
    if (typeof a_1[0] !== "string")
        return false;
    if (t_1 !== undefined) {
        if (typeof t_1 !== "object" || t_1 === null)
            return false;
        if (typeof t_1.b !== "number")
            return false;
    }
    return true;
}

function arr_deconstruction_full(a) {
    if (typeof a !== "object" || a === null)
        return false;
    const { a: a_1 } = a;
    if (!Array.isArray(a_1))
        return false;
    const [first, second, t_1] = a_1;
    if (typeof second !== "number")
        return false;
    if (typeof first !== "string")
        return false;
    if (t_1 !== undefined) {
        if (typeof t_1 !== "object" || t_1 === null)
            return false;
        if (typeof t_1.b !== "number")
            return false;
    }
    return true;
}

const item1 = { a: ["abc", 2, { b: 333 }] };
const item2 = { a: ["wdwdwwewewe", 2323, { b: 21212 }] };
const item3 = { a: [123, "avdwdwdw", { b: 23232 }] };

const allData2 = Array.from({ length: 3000 }, (_, i) => i % 2 === 0 ? [item1, item3, item2] : [item2, item1, item3]).flat();

group("Tuple deconstruction", () => {
    bench("Partial", () => {
        for (const data of allData2) {
            arr_deconstruction_partial(data);
        } 
    });

    bench("Full", () => {
        for (const data of allData2) {
            arr_deconstruction_full(data);
        } 
    });
});


const allData3 = Array.from({ length: 8000 }, () => random(["string", 123, 812, 27427, 17272, undefined, {}, [], "abc", true, false, false, true, false, 372, 72626]));

group("Typeof Number", () => {
    bench("Typeof number", () => {
        let counter = 0;
        for (const data of allData3) {
            if (typeof data === "number") counter++;
        }
    });

    bench("isNaN", () => {
        let counter = 0;
        for (const data of allData3) {
            if (!isNaN(data as number)) counter++;
        }
    });
});

group("Typeof Boolean", () => {
    bench("Typeof Bumber", () => {
        let counter = 0;
        for (const data of allData3) {
            if (typeof data !== "boolean") counter++;
        }
    });

    bench("true and false checks", () => {
        let counter = 0;
        for (const data of allData3) {
            if (data !== false && data !== true) counter++;
        }
    });
});

await run();