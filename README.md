# ts-runtime-checks

A typescript transformer which automatically generates validation code from your types. Think of it as a validation library like [ajv](https://ajv.js.org/guide/typescript.html) and [ts-runtime](https://github.com/fabiandev/ts-runtime), except it **completely** relies on the typescript compiler, and generates vanilla javascript code on demand. This comes with a lot of advantages:

- It's just types - no extra configuration, boilerplate or schemas needed.
- Only validate where you see fit.
- Makes your app faster - code is generated during the transpilation phase, and can be easily optimized by V8.
- Powerful - built on top of typescript's type system, which is turing-complete.

Here is a very simple example:

```ts
import type { Assert } from "ts-runtime-checks";

type AssertNum = Assert<number>;

function greet(name: Assert<string>, age: AssertNum) : string {
    return `Hello ${name}! I'm ${age} too!`;
}

// Transpiles to:
function greet(name, age) {
    if (typeof name !== "string") throw new Error("Expected name to be string.");
    if (typeof age !== "number") throw new Error("Expected age to be number.");
    return `Hello ${name}! I'm ${age} too!`;
}
```

The special `Assert` type gets detected during transpilation, and replaced with appropriate validation checks.

Check out the [playground](https://googlefeud.github.io/ts-runtime-checks/) if you want to play with the transformer without setting up an enviourment!

## Usage

```
npm i --save-dev ts-runtime-checks
```

Sadly, `tsc` doesn't allow you to add custom transformers, so you must use a tool which adds them:

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
        before: [TsRuntimeChecks(program)]
      }
}
```
</details>

## `ts-runtime-checks` in depth

### Markers

Markers are typescript type aliases which are detected by the transformer. These types don't represent actual values, but they tell the transformer what code to generate. Think of them as functions!

By far the most important marker is `Assert<T>`, which tells the transpiler to validate the type `T`. There are also `utility` markers which can be used inside an `Assert` marker to customize the validation in some way or to add extra checks. Here's the list of all utility markers:

- `Num<{min, max, type}>` - More detailed number requirements.
- `Str<{matches, length}>` - More detailed string requirements.
- `Arr<{length, minLen, maxLen}>` - More detailed array requirements.
- `NoCheck<Type>`- Doesn't generate checks for the provided type.
- `ExactProps<Obj, removeExtra, useDeleteOperator>` - Makes sure the value doesn't have any excessive properties.
- `If<Type, Condition, fullCheck>` - Checks if `Condition` is true for the value of type `Type`. 
- `Expr<string>` - Turns the string into an expression. Can be used in markers which require a javascript value - `EarlyReturn`, `Num.min/max` and `Str.matches` for example.
- `Infer<Type>` / `Resolve<Type>` - Creating validation for type parameters.

#### Assert<Type, Action>

The `Assert` marker asserts that a value is of the provided type by adding **validation code** that gets executed during runtime. If the value doesn't match the type, the code will either return a value or throw an error, depending on what `Action` is.

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

For `Action`, you can provide the following types:
- Type literals (`123`, `"hello"`, `undefined`, `true`, `false`) - The literal will be returned.
- `Expr<Type>` - The expression will be returned.
- `ErrorMsg<rawErrors>` - The error message will be returned.
- `ThrowError<ErrorType, rawErrors>` - An error of type `ErrorType` will be thrown.

If `rawErrors` is true, instead of an error string, the transformer will pass / return an object like this:

```js
{
    // The value of the item that caused it
    value: any
    // The name of the value
    valueName: string
    // Extra parts that form the error string
    parts: string
}
```

By default, `ThrowError<Error>` is passed to `Assert`.

```ts
function getType(element: { type: unknown }) : string {
    return element.type as Assert<string, ErrorMsg>;
}

// Transpiles to:
function getType(element) {
    if (typeof element.type !== "string") return "Expected element.type to be a string";
    return element.type;
}
```

#### Num<{min, max, type}>

Allows you to check if the number is greater than / less than an amount, or if it's a floating point or an integer.

```ts
const someNum = 50;

type AssertRange<min> = Num<{
    type: "int",
    min: min,
    max: Expr<"someNum">
}>

function test(num1: AssertRange<1>, num2: AssertRange<10>, num3: AssertRange<Expr<"someNum">>) {
    // Your code
}

// Transpiles to:
function test(num1, num2, num3) {
    if (typeof num1 !== "number" || num1 % 1 !== 0 || num1 < 1 || num1 > someNum)
        throw new Error("Expected num1 to be an integer, to be greater than 1 and to be less than someNum.");
    if (typeof num2 !== "number" || num2 % 1 !== 0 || num2 < 10 || num2 > someNum)
        throw new Error("Expected num2 to be an integer, to be greater than 10 and to be less than someNum.");
    if (typeof num3 !== "number" || num3 % 1 !== 0 || num3 < someNum || num3 > someNum)
        throw new Error("Expected num3 to be an integer, to be greater than someNum and to be less than someNum.");
}

```

#### Str<settings>

Allows you to check whether the string matches a regex, or whether it's a certain length.

```ts
function test(a: Assert<Str<{
    matches: "/abc/",
    //length: 12,
    minLen: 3,
    maxLen: 100
}>>) {
   // Your code...
}

// Transpiles to:
function test(a) {
    if (typeof a !== "string" || a.length < 3 || a.length > 100 || !/abc/.test(a))
        throw new Error("Expected a to be a string, to have a minimum length of 3, to have a maximum length of 100 and to match /abc/.");
}
```

#### Arr<Type, settings>

Allows you to validate the array's length.

```ts
function test(a: Assert<Arr<number, {
    // length: 10,
    minLen: 1,
    maxLen: 10
}>>) {
   // Your code...
}

// Transpiles to:
function test(a) {
    if (!(a instanceof Array) || a.length < 1 || a.length > 10)
        throw new Error("Expected a to be an Array, to have a minimum length of 1 and to have a maximum length of 10.");
    for (let i_1 = 0; i_1 < a.length; i_1++) {
        const x_1 = a[i_1];
        if (typeof x_1 !== "number")
            throw new Error("Expected " + ("a[" + i_1 + "]") + " to be number.");
    }
}

```

#### NoCheck<Type>

Skips validating the value.

```ts
interface UserRequest {
    name: string,
    id: string,
    value: NoCheck<unknown>
}

function test(req: Assert<UserRequest>) {
    // Your code...
}

// Transpiles to:
function test(req) {
    if (typeof req !== "object") throw new Error("Expected req to be UserRequest.");
    if (typeof req["name"] !== "string") throw new Error("Expected req.name to be string.");
    if (typeof req["id"] !== "string") throw new Error("Expected req.id to be string.");
}
```

#### ExactProps<Type, removeExtra, useDeleteOperator> 

Checks if an object has any "excessive" properties (properties which are not on the type but they are on the object).

If `removeExtra` is true, then instead of an error getting thrown, any excessive properties will be deleted **in place** from the object.

If `useDeleteOperator` is true, then the `delete` operator will be used to delete the property, otherwise the property will get set to undefined.

```ts
function test(req: unknown) {
    return req as Assert<ExactProps<{a: string, b: number, c: [string, number]}>>;
}

// Transpiles to:
function test(req) {
    if (typeof req !== "object") throw new Error("Expected req to be { a: string; b: number; c: [string, number]; }.");
    if (typeof req["a"] !== "string") throw new Error("Expected req.a to be string.");
    if (typeof req["b"] !== "number") throw new Error("Expected req.b to be number.");
    if (!(req["c"] instanceof Array)) throw new Error("Expected req.c to be [string, number].");
    if (typeof req["c"][0] !== "string") throw new Error("Expected " + ("req.c[" + 0 + "]") + " to be string.");
    if (typeof req["c"][1] !== "number") throw new Error("Expected " + ("req.c[" + 1 + "]") + " to be number.");
    for (let name_1 in req) {
        if (name_1 !== "a" && name_1 !== "b" && name_1 !== "c")
            throw new Error("Property " + ("req[" + name_1 + "]") + " is excessive.");
    }
    return req;
}
```

#### If<Type, Condition, FullCheck>

Allows you to create custom comparisons by providing a string containing javascript code. You can use `$self` in the expression, it'll be replaced by the expression of the value that's currently being validated. 

`FullCheck` is a boolean - if it's set to true, then validation code will be generated for `Type`, if it's set to false (which is the default), only the condition which you provide will be enough to validate it. 

```ts
// Creating a less flexible version of the Range marker
type Range<min extends number, max extends number> = Assert<If<number, `$self < ${min} && $self > ${max}`>>;

function test(num: Range<1, 5>) {
    // Your code...
}

// Transpiles to:
function test(num) {
    if (!(num < 1 && num > 5)) throw new Error("Expected num to satisfy `$self < 1 && $self > 5`.");
    // Your code...
}
```

#### Infer<Type>

You can use this utility type on type parameters - the transformer is going to go through all call locations of the function the type parameter belongs to, figure out the actual type used, create a union of all the possible types and validate it inside the function body.

```ts
export function test<T>(body: Assert<Infer<T>>) {
    return true;
}

// in fileA.ts
test(123);

// in FileB.ts
test([1, 2, 3]);

// Transpiles to:
function test(body) {
    if (typeof body !== "number")
        if (!Array.isArray(body))
            throw new Error("Expected body to be one of number, number[]");
        else {
            for (let i_1 = 0; i_1 < len_1; i_1++) {
                if (typeof body[i_1] !== "number")
                    throw new Error("Expected body[" + i_1 + "] to be a number");
            }
        }
    return true;
}
```

#### Resolve<Type>

Pass a type parameter to `Resolve<Type>` to *move* the validation logic to the call site, where the type parameter is resolved to an actual type.

Currently, this marker has some limitations:
- Can only be used in `Assert` markers (so you can't use it in `check` or `is`).
- If used in a parameter declaration, the parameter name **has** to be an identifier (no deconstructions).
- Cannot be used on rest parameters.

```ts
function validateBody<T>(data: Assert<{ body: Resolve<T> }>) {
    return data.body;
}

const validatedBody = validateBody<{
    name: string,
    other: boolean
}>({ body: JSON.parse(process.argv[2]) });

// Transpiles to:
function validateBody(data) {
    return data.body;
}
const receivedBody = JSON.parse(process.argv[2]);
const validatedBody = (() => {
    const data = { body: receivedBody };
    if (typeof data.body !== "object" && data.body !== null)
        throw new Error("Expected data.body to be an object");
    if (typeof data.body.name !== "string")
        throw new Error("Expected data.body.name to be a string");
    if (typeof data.body.other !== "boolean")
        throw new Error("Expected data.body.other to be a boolean");
    return validateBody(data);
})();
```

#### `Str`, `Num` and `Arr` alternatives

Instead of using the markers mentioned above, you can use JS Doc comments to specify the extra requirements of a certain type. The requirements have the same names:

```ts
interface Test {
    /**
     * @minLen 1
     * @maxLen 10
    */
    name: string,
    /**
     * @min 17
     * @max 100
     * @type int 
    */
    age: number
}

const variable = {} as Assert<Test>;

// Transpiles to:
const value_1 = {};
if (typeof value_1 !== "object" && value_1 !== null)
    throw new Error("Expected value to be an object");
if (typeof value_1.name !== "string" || value_1.name.length < 1 || value_1.name.length > 10)
    throw new Error("Expected value.name to be a string, to have a length greater than 1, to have a length less than 10");
if (typeof value_1.age !== "number" || value_1.age < 17 || value_1.age > 100)
    throw new Error("Expected value.age to be a number, to be greater than 17, to be less than 100");
const variable = value_1;
```

### Supported types and code generation

- `string`s and string literals
    - `typeof value === "string"` or `value === "literal"`
- `number`s and number literals
    - `typeof value === "number"` or `value === 420`
- `boolean`
    - `typeof value === "boolean"`
- `symbol`
    - `typeof value === "symbol"`
- `bigint`
    - `typeof value === "bigint"`
- `null`
    - `value === null`
- Tuples (`[a, b, c]`)
    - `Array.isArray(value)`
    - Each type in the tuple gets checked individually.
- Arrays (`Array<a>`, `a[]`)
    - `Array.isArray(value)`
    - Each value in the array gets checked via a `for` loop.
- Interfaces and object literals (`{a: b, c: d}`)
    - `typeof value === "object"`
    - `value !== null`
    - Each property in the object gets checked individually.
- Classes
    - `value instanceof Class`
- Enums
- Unions (`a | b | c`)
    - Object unions - If you want to have a union of multiple possible objects, each object must have at least 1 key that's either a string or a number literal.

### `as` assertions

You can use `as` type assertions to validate values in expressions. The transformer remembers what's safe to use, so you can't generate the same validation code twice.

```ts
interface Args {
    name: string,
    path: string,
    output: string,
    clusters?: number
}

const args = JSON.parse(process.argv[2] as Assert<string>) as Assert<Args>;

// Transpiles to:
if (typeof process.argv[2] !== "string")
    throw new Error("Expected process.argv[2] to be string.");
const temp_1 = JSON.parse(process.argv[2]);
if (typeof temp_1 !== "object")
    throw new Error("Expected value to be Args.");
if (typeof temp_1["name"] !== "string")
    throw new Error("Expected value.name to be string.");
if (typeof temp_1["path"] !== "string")
    throw new Error("Expected value.path to be string.");
if (typeof temp_1["output"] !== "string")
    throw new Error("Expected value.output to be string.");
if ("clusters" in temp_1 && typeof temp_1["clusters"] !== "number")
    throw new Error("Expected value.clusters to be number.");
const args = temp_1;
```

### `is<Type>(value)` utility function

Utility function. Every call to this function gets replaced with an immediately-invoked arrow function, which returns `true` if the value matches the type, `false` otherwise.

```ts
const val = JSON.parse("[\"Hello\", \"World\"]");;
if (is<[string, number]>(val)) {
    // val is guaranteed to be [string, number]
}

// Transpiles to:

const val = JSON.parse("[\"Hello\", \"World\"]");
if ((() => {
    if (!(val instanceof Array)) return false;
    if (typeof val[0] !== "string") return false;
    if (typeof val[1] !== "number") return false;
    return true;
})()) { 
    // Your code...
}
```

### `check<Type>(value)` utility function

Utility function. Every call to this function gets replaced with an immediately-invoked arrow function, which returns the provided value, along with an array of errors.

```ts
const [value, errors] = check<[string, number]>(JSON.parse("[\"Hello\", \"World\"]"));
if (errors.length) console.log(errors);

// Transpiles to:

const value = JSON.parse("[\"Hello\", \"World\"]");
const errors = [];
if (!(value instanceof Array)) errors.push("Expected value to be [string, number].");
if (typeof value[0] !== "string") errors.push("Expected " + ("value[" + 0 + "]") + " to be string.");
if (typeof value[1] !== "number") errors.push("Expected " + ("value[" + 1 + "]") + " to be number.");
if (errors.length) console.log(errors);
```

### Destructuring

If a value is a destructured object / array, then only the deconstructed properties / elements will get validated.

```ts
function test({user: { skills: [skill1, skill2, skill3] }}: Assert<{
    user: {
        username: string,
        password: string,
        skills: [string, string?, string?]
    }
}, undefined>) {
    // Your code
}

// Transpiles to:
function test({
    user: {
        skills: [skill1, skill2, skill3]
    }
}) {
    if (typeof skill1 !== "string") return undefined;
    if (skill2 !== undefined && typeof skill2 !== "string") return undefined;
    if (skill3 !== undefined && typeof skill3 !== "string") return undefined;
}
```

### Complex types

Markers **can** be used in type aliases, so you can easily create shortcuts to common patterns:

```ts
interface User {
    name: string,
    id: number,
    age: number,
    friends: Array<NoCheck<User>>
}

// You can prefix all your assertion types with a $.
type $User = Assert<User, TypeError>;

function test(a: $User) {
    // your code..
}

// Transpiles to:

function test(a) {
    if (typeof a !== "object") throw new TypeError("Expected a to be User.");
    if (typeof a["name"] !== "string") throw new TypeError("Expected a.name to be string.");
    if (typeof a["id"] !== "number") throw new TypeError("Expected a.id to be number.");
    if (typeof a["age"] !== "number") throw new TypeError("Expected a.age to be number.");
    if (!(a["friends"] instanceof Array)) throw new TypeError("Expected a.friends to be NoCheck<User>[].");
}
```

## Contributing

`ts-runtime-checks` is being maintained by a single person. Contributions are welcome and appreciated. Feel free to open an issue or create a pull request at https://github.com/GoogleFeud/ts-runtime-checks