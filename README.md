# ts-runtime-checks

A typescript transformer which automatically generates validation code from your types. Think of it as a validation library like [ajv](https://ajv.js.org/guide/typescript.html) and [zod](https://zod.dev/), except it **completely** relies on the typescript compiler, and generates vanilla javascript code on demand. This comes with a lot of advantages:

- It's just types - no boilerplate or schemas needed.
- Only validate where you see fit.
- Code is generated during the transpilation phase, and can be easily optimized by V8.
- Powerful - built on top of typescript's type system, which is turing-complete.

Here are some examples you can try out in the [playground](https://googlefeud.github.io/ts-runtime-checks/):

**Asserting function parameters:**
```ts
function greet(name: Assert<string>, age: Assert<number>) : string {
    return `Hello ${name}, you are ${age} years old!`
}

// Transpiles to:
function greet(name, age) {
    if (typeof name !== "string") throw new Error("Expected name to be a string");
    if (typeof age !== "number") throw new Error("Expected age to be a number");
    return `Hello ${name}, you are ${age} years old!`;
}
```
**Checking whether a value is of a certain type:**
```ts
interface User {
    name: string,
    age: number & Min<13>
}

const maybeUser = { name: "GoogleFeud", age: "123" }
const isUser = is<User>(maybeUser);

// Transpiles to:
const isUser = typeof maybeUser === "object" && maybeUser !== null && typeof maybeUser.name === "string" && (typeof maybeUser.age === "number" && maybeUser.age > 13);
```
**Pattern Matching:**
```ts
const extractString = createMatch<string>([
    (value: string | number) => value.toString(),
    ({value}: { value: string }) => value,
    () => {
        throw new Error("Could not extract string.");
    }
]);

//Transpiles to:
const extractString = value_1 => {
    if (typeof value_1 === "string") return value_1.toString();
    else if (typeof value_1 === "number") return value_1.toString();
    else if (typeof value_1 === "object" && value_1 !== null) {
        if (typeof value_1.value === "string") {
            let { value } = value_1;
            return value;
        }
    }
    throw new Error("Could not extract string.");
};
```

## Usage

```
npm i --save-dev ts-runtime-checks
```

<details>
    <summary>Usage with ts-patch</summary>

```
npm i --save-dev ts-patch
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

Afterwards you can either use the `tspc` CLI command to transpile your typescript code.
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

<details>
    <summary>Usage with ts-node</summary>

To use transformers with ts-node, you'll have to change the compiler in the `tsconfig.json`:

```
npm i --save-dev ts-patch
```

```json
"ts-node": {
    "compiler": "ts-patch"
  },
  "compilerOptions": {
    "plugins": [
        { "transform": "ts-runtime-checks" }
    ]
  }
```
</details>

## `ts-runtime-checks` in depth

### Markers

Markers are typescript type aliases which are detected by the transformer. These types don't represent actual values, but they tell the transformer what code to generate. Think of them as functions!

By far the most important marker is `Assert<T>`, which tells the transpiler to validate the type `T`. There are also `utility` markers which can be used inside an `Assert` marker to customize the validation in some way or to add extra checks. Here's the list of all utility markers:

- `Check<Condition, Error, Id, Value>` - Checks if `Condition` is true for the value.
- `NoCheck<Type>`- Doesn't generate checks for the provided type.
- `ExactProps<Obj, removeExtra, useDeleteOperator>` - Makes sure the value doesn't have any excessive properties.
- `Expr<string>` - Turns the string into an expression. Can be used in markers which require a javascript value.
- `Infer<Type>` / `Resolve<Type>` - Creating validation for type parameters.

The library also exports a set of built-in `Check` type aliases, which can be used on existing types to add extra checks:

- `Min<Size>` / `Max<Size>` - Used with the `number` type to check if a number is within bounds.
- `Integer` / `Float` - Used with the `number` type to limit the value to integers / floating points.
- `MaxLen<Size>` / `MinLen<Size>` / `Length<Size>` - Used with anything that has a `length` property to check if it's within bounds.
- `Matches<Regex>` - Used with the `string` type to check if the value matches a pattern.
- `Not` - Negates a `Check`.
- `Or` - Logical OR operator for `Check`.

#### `Assert<Type, Action>`

The `Assert` marker asserts that a value is of the provided type by adding **validation code** that gets executed during runtime. If the value doesn't match the type, the code will either return a value or throw an error, depending on what `Action` is:

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
    // Information about the expected type
    expectedType: TypeData
}
```

By default, `ThrowError<Error>` is passed to `Assert`.

```ts
function onMessage(
    msg: Assert<string>, 
    content: Assert<string, false>,
    timestamp: Assert<number, ThrowError<RangeError, true>>
    ) {
        // ...
}

function onMessage(msg, content, timestamp) {
    if (typeof msg !== "string") throw new Error("Expected msg to be a string");
    if (typeof content !== "string") return false;
    if (typeof timestamp !== "number") throw new RangeError({ value: timestamp, valueName: "timestamp", expectedType: { kind: 0 }});
}
```

#### `Check<Condition, Error, ID, Value>`

Allows you to create custom conditions by providing a string containing javascript code.

- You can use the `$self` variable to get the value that's currently being validated.
- You can use the `$parent` function to get the parent object of the value. You can pass a number to get nested parents.

`Error` is a custom error string message that will get displayed if the check fails.

```ts
type StartsWith<T extends string> = Check<`$self.startsWith("${T}")`, `to start with "${T}"`, "startsWith", T>;

function test(a: Assert<string & StartsWith<"a">>) {
    return true;
}

// Transpiles to:
function test(a) {
    if (typeof a !== "string" || !a.startsWith("a")) throw new Error("Expected a to be a string, to start with \"a\"");
    return true;
}
```

You can combine checks using the `&` (intersection) operator:

```ts
// MaxLen and MinLen are types included in the library
function test(a: Assert<string & StartsWith<"a"> & MaxLen<36> & MinLen<3>>) {
    return true;
}

// Transpiles to:
function test(a) {
    if (typeof a !== "string" || !a.startsWith("a") || a.length > 36 || a.length < 3)
        throw new Error("Expected a to be a string, to start with \"a\", to have a length less than 36, to have a length greater than 3");
    return true;
}
```

The `ID` and `Value` type parameters get used when you want to receive a raw error. You don't need to use them if you don't make use of raw errors. They get passed to the `expectedType` object, where `ID` is the key and `Value` is the value:

```ts
function test(a: Assert<string & StartsWith<"a">, ThrowError<Error, true>>) {
    return 1;
}

// Transpiles to:
function test(a) {
    if (typeof a !== "string" || !a.startsWith(a)) throw new Error({ value: a, valueName: "a", expectedType: { kind: 1, startsWith: "a" } });
    return 1;
}
```

#### `NoCheck<Type>`

Skips validating the value.

```ts
interface UserRequest {
    name: string,
    id: string,
    child: NoCheck<UserRequest>
}

function test(req: Assert<UserRequest>) {
    // Your code...
}

// Transpiles to:
function test(req) {
    if (typeof req !== "object" || req === null) throw new Error("Expected req to be an object");
    if (typeof req.name !== "string") throw new Error("Expected req.name to be a string");
    if (typeof req.id !== "string") throw new Error("Expected req.id to be a string");
}
```

#### `ExactProps<Type, removeExtra, useDeleteOperator>`

Checks if an object has any "excessive" properties (properties which are not on the type but they are on the object).

If `removeExtra` is true, then instead of an error getting thrown, any excessive properties will be deleted **in place** from the object.

If `useDeleteOperator` is true, then the `delete` operator will be used to delete the property, otherwise the property will get set to undefined.

```ts
function test(req: unknown) {
    return req as Assert<ExactProps<{a: string, b: number, c: [string, number]}>>;
}

// Transpiles to:

function test(req) {
    if (typeof req !== "object" || req === null) throw new Error("Expected req to be an object");
    if (typeof req.a !== "string") throw new Error("Expected req.a to be a string");
    if (typeof req.b !== "number") throw new Error("Expected req.b to be a number");
    if (!Array.isArray(req.c)) throw new Error("Expected req.c to be an array");
    if (typeof req.c[0] !== "string") throw new Error("Expected req.c[0] to be a string");
    if (typeof req.c[1] !== "number") throw new Error("Expected req.c[1] to be a number");
    for (let p_1 in req) {
        if (p_1 !== "a" && p_1 !== "b" && p_1 !== "c") throw new Error("Property req." + p_1 + " is excessive");
    }
    return req;
}
```

#### `Infer<Type>`

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

#### `Resolve<Type>`

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
- `undefined`
    - `value === undefined`
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
    - Discriminated unions - Each type in the union must have a value that's either a string or a number literal.
- Function type parameters
    - Inside the function as one big union with the `Infer` utility type.
    - At the call site of the function with the `Resolve` utility type.
- Recursive types
    - A function gets generated for recursive types, with the validation code inside.
    - **Note:** Currently, because of limitations, errors in recursive types are a lot more limited.

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
    throw new Error("Expected process.argv[2] to be a string");
const value_1 = JSON.parse(process.argv[2]);
if (typeof value_1 !== "object" || value_1 === null)
    throw new Error("Expected value to be an object");
if (typeof value_1.name !== "string")
    throw new Error("Expected value.name to be a string");
if (typeof value_1.path !== "string")
    throw new Error("Expected value.path to be a string");
if (typeof value_1.output !== "string")
    throw new Error("Expected value.output to be a string");
if (value_1.clusters !== undefined && typeof value_1.clusters !== "number")
    throw new Error("Expected value.clusters to be a number");
const args = value_1;
```

### `is<Type>(value)`

Every call to this function gets replaced with an immediately-invoked arrow function, which returns `true` if the value matches the type, `false` otherwise.

```ts
const val = JSON.parse("[\"Hello\", \"World\"]");;
if (is<[string, number]>(val)) {
    // val is guaranteed to be [string, number]
}

// Transpiles to:

const val = JSON.parse("[\"Hello\", \"World\"]");
if (Array.isArray(val) && typeof val[0] === "string" && typeof val[1] === "number") {
    // Your code
}
```

### `check<Type, rawErrors>(value)`

Every call to this function gets replaced with an immediately-invoked arrow function, which returns the provided value, along with an array of errors.

If `rawErrors` is true, the raw error data will be pushed to the array instead of error strings.

```ts
const [value, errors] = check<[string, number]>(JSON.parse("[\"Hello\", \"World\"]"));
if (errors.length) console.log(errors);

// Transpiles to:

const value = JSON.parse("[\"Hello\", \"World\"]");
const errors = [];
if (!Array.isArray(value)) errors.push("Expected value to be an array");
else {
    if (typeof value[0] !== "string") errors.push("Expected value[0] to be a string");
    if (typeof value[1] !== "number") errors.push("Expected value[1] to be a number");
}
if (errors.length) console.log(errors);
```

### `createMatch<ReturnType, InputType>(function[], discriminatedObjAssert)`

Creates a match function which performs pattern-matching on the input type, based on the provided functions. Each function in the array is a match arm, where the type of the first parameter is the type the arm is matching against:

```ts
// We want the match function to return a string and to accept a number
const resolver = createMatch<string, number>([
    // Match arm which catches the values 0 or 1
    (_: 0 | 1) => "not many",
    // Match arm which catches any number less than 9
    (_: number & Max<9>) => "a few",
    // Match arm which catches any number that hasn't already been caught
    (_: number) => "lots"
]);

// Transpiles to:
const resolver = value_1 => {
    if (typeof value_1 === "number") {
        if (value_1 === 1 || value_1 === 0) return "not many";
        else if (value_1 < 9) return "a few";
        else return "lots";
    }
};
```

You could also have a default match arm by omitting the parameter, or giving it the `unknown` or `any` type:

```ts
const toNumber: (value: unknown) => number = createMatch<number>([
    (value: string | boolean) => +value,
    (value: number) => value,
    (value: Array<string> | Array<number> | Array<boolean>) => value.map(v => toNumber(v)).reduce((val, acc) => val + acc, 0),
    (value: unknown) => {
        throw new Error("Unexpected value: " + value);
    }
]);

// Transpiles to:
const toNumber = value_1 => {
    if (typeof value_1 === "boolean")  return +value_1;
    else if (typeof value_1 === "string") return +value_1;
    else if (typeof value_1 === "number") return value_1;
    else if (Array.isArray(value_1)) {
        if (value_1.every(value_2 => typeof value_2 === "string") || value_1.every(value_3 => typeof value_3 === "number") || value_1.every(value_4 => typeof value_4 === "boolean"))
            return value_1.map(v => toNumber(v)).reduce((val, acc) => val + acc, 0);
    }
    throw new Error("Unexpected value: " + value_1);
};
```

If the `discriminatedObjAssert` parameter is set to true, then the properties of objects that contain a literal string or number will not be validated. Use this if you have already validated the source or if you know that it's correct.

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
function test({ user: { skills: [skill1, skill2, skill3] } }) {
    if (typeof skill1 !== "string") return undefined;
    if (skill2 !== undefined && typeof skill2 !== "string") return undefined;
    if (skill3 !== undefined && typeof skill3 !== "string") return undefined;
}
```

### Complex types

Markers **can** be used in type aliases, so you can easily create shortcuts to common patterns:

**Combining checks:**
```ts
// Combining all number related checks into one type
type Num<
    min extends number|undefined = undefined, 
    max extends number|undefined = undefined, 
    typ extends Int|Float|undefined = undefined>
        = number & (min extends number ? Min<min> : number) & (max extends number ? Max<max> : number) & (typ extends undefined ? number : typ);

function verify(n: Assert<Num<2, 10, Int>>) {
    // ...
}

// Transpiles to:
function verify(n) {
    if (typeof n !== "number" || n < 2 || n > 10 || n % 1 !== 0) throw new Error("Expected n to be a number, to be greater than 2, to be less than 10, to be an int");
}
```

### Generating JSON Schemas from your types

The transformer allows you to turn any of the types you use in your project into [JSON Schemas](https://json-schema.org/) with the `jsonSchema` configuration option:

```js
"compilerOptions": {
//... other options
"plugins": [
        { 
            "transform": "ts-runtime-checks",
            "jsonSchema": {
                "dist": "./schemas"
            }
        }
    ]
}
```

Using the configuration above, all types in your project will be turned into JSON Schemas and be saved in the `./schemas` directory, each one in different file. You can also filter types by using either the `types` option or the `typePrefix` option:

```js
"jsonSchema": {
    "dist": "./schemas",
    // Only specific types will be turned to schemas
    "types": ["User", "Member", "Guild"],
    // Only types with names that start with a specific prefix will be turned to schemas
    "typePrefix": "$"
}
```


## Contributing

`ts-runtime-checks` is being maintained by a single person. Contributions are welcome and appreciated. Feel free to open an issue or create a pull request at https://github.com/GoogleFeud/ts-runtime-checks