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

`tsc` doesn't allow you to add custom transformers, so you must use a tool which adds them:

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

## `ts-runtime-checks` in depth

### Markers

Markers are typescript type aliases which are detected by the transformer. These types don't represent actual values, but they tell the transformer what code to generate. Think of them as functions! This transformer has two type of markers:

- `Assertions` - Tell the transformer that the value associated with this type needs to be checked during runtime. These types can be used in either **function parameters** or in **type assertions**.
    - `Assert`
    - `EarlyReturn`
- `Utility` - Types which perform additional checks. These types should be only used inside `Assertion` types.
    - `Range<min, max>` - Checks if a number are in the provided range.
    - `Matches<regex>` - Checks if a string matches a regex.
    - `NoCheck<Type>`- Doesn't generate checks for the provided type.
    - `ExactProps<Obj>` - Makes sure the value doesn't have any excessive properties.
    - `CmpKey<Obj, key, value, fullCheck>` - Checks if `Obj[key] === value`. 

##### Assert<Type, ErrorType>

The `Assert` marker asserts that a value is of the provided type by adding **validation code** that gets executed during runtime. If the value doesn't match the type, it throws a new error of the provided `ErrorType`, and it includes a detailed error of what exactly is wrong.

**Example:**

```ts
function addPlayer(player: Assert<{name: string, id: number}>) : void {
    players.push(player);
}

// Transpiles to:
function addPlayer(player) {
    if (typeof player !== "object") throw new Error("Expected player to be { name: string; id: number; }.");
    if (typeof player["name"] !== "string") throw new Error("Expected player.name to be string.");
    if (typeof player["id"] !== "number") throw new Error("Expected player.id to be number.");
    players.push(player);
}
```

You can provide a custom error if you'd like:

```ts
function getType(element: { type: unknown }) : string {
    return element.type as Assert<string, IncorrectElementType>;
}

// Transpiles to:
function getType(element) {
    if (typeof element.type !== "string") throw new IncorrectElementType("Expected " + element.type + " to be string.");
    return element.type;
}
```
