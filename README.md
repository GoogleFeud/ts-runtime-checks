# ts-runtime-checks

A typescript transformer which automatically generates validation code from your types! Here's a simple example:

```ts
import type { Assert } from "ts-runtime-checks";

function greet(name: Assert<string>, age: Assert<number>) : string {
    return `Hello ${name}! I'm ${age} too!`;
}
```

transpiles to:

```js
function greet(name, age) {
    if (typeof name !== "string") throw new Error("Expected name to be string.");
    if (typeof age !== "number") throw new Error("Expected age to be number.");
    return `Hello ${name}! I'm ${age} too!`;
}
```

## Usage

```
npm i --save-dev ts-runtime-checks
```

### With ttypescript

`tsc` doesn't allow you to add custom transformers, so you must use a tool which adds them. ttypescript does just that:

```
npm i --save-dev ttypescript
```

<details>
    <summary>Usage with ttypescript</summary>
    ```
npm i --save-dev ttypescript
    ```
    and add the ts-runtime-checks transformer to your tsconfig.json:

    ```json
    "compilerOptions": {
    //... other options
    "plugins": [
            { "transform": "ts-runtime-checks" }
        ]
    }
    ```
    Afterwards you must use the `ttsc` CLI command to transpile your typescript code.
</details>

<details>
    <summary>Usage with ts-loader</summary>

```js
const TsRuntimeChecks = require("ts-runtime-checks").default;

options: {
      getCustomTransformers: program => {
        before: [TsMacros(program)]
      }
}
```
</details>
