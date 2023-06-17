import { run, bench, group } from "mitata";
import { Assert, Num, Str, Arr, NoCheck, ExactProps } from "../../dist/index.js";


function string1(str: Assert<string>) { return; }
function string2(str: Assert<Str<{ minLen: 1, maxLen: 10 }>>) { return; }

bench("Simple string", () => string1("Hello, World"));
bench("Complex string", () => string2("Hello, Wo"));

(async () => {
    run();
})();