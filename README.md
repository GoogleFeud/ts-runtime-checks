# ts-runtime-checks

A typescript transformer which allows you to never worry about users of your library passing incorrect data! This transformer adds runtime checks so you **always** know the data you use 100% correct, without EVER seeing the validation code.

Here's an example in functions:

```ts
import { Assert } from "ts-runtime-checks";

interface MyType {
    a: string,
    b?: number
}

function someFn(param: Assert<MyType>) {
    // "param" is **guaranteed** to be "MyType" here. NO EXCPETIONS!
}
```

Generated javascript would look something like this:

```js
function someFn(param) {
    if (!("a" in param) || typeof param.a !== "string") throw new Error("`param.a` needs to be of type `string`.");
    else if ("b" in param && typeof typeof param.b !== "number") throw new Error("`param.b` needs to be of type `number`.");
    // Rest of your code...
}
```

You can add assert code elsewhere using the `as` keyword:

```ts
someFn({ a: number } as Assert<MyType>);
```

Results in:

```ts
let temp__ = { a: number };
if (!("a" in temp__) || typeof temp__.a !== "string") throw new Error("`obj.a` needs to be of type `string`.");
else if ("b" in temp__ && typeof typeof temp__.b !== "number") throw new Error("`obj.b` needs to be of type `number`.");
someFn(temp__);
```

