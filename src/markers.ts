import ts from "typescript";
import { Block } from "./block";
import { Transformer } from "./transformer";
import { validate, ValidationContext } from "./validation";

export const enum MacroCallContext {
    As,
    Parameter
}

export interface MarkerCallData {
    parameters: Array<ts.Type>,
    block: Block<unknown>,
    ctx: MacroCallContext,
    optional?: boolean,
    exp: ts.BindingName,
    paramName: string
}

export type MacroFn = (transformer: Transformer, data: MarkerCallData) => ts.Node|undefined;

export const Markers: Record<string, MacroFn> = {
    Assert: (trans, {ctx, exp, block, parameters, optional, paramName}) => {
        if (!parameters[0]) return;
        if (ctx === MacroCallContext.Parameter) {
            if (ts.isIdentifier(exp)) {
                block.nodes.push(...validate(parameters[0], exp, new ValidationContext({
                    errorTypeName: parameters[1]?.symbol?.name,
                    checker: trans.checker,
                    depth: [],
                    propName: paramName
                }), optional));
            }
            return undefined;
        } else return undefined;
    }
};

/**
 * An assert marker. Makes sure the value matches the provided type by generating code which validates the value. 
 * Throws a detailed error by using the `Error` constructor. You can speicfy a different class to use as the marker's
 * second parameter. 
 * 
 * This marker can be used in function parameters and in the the `as` expression.
 * 
 * @example
 * ```ts
 * function test(a: Assert<string>, b?: Assert<number, TypeError>) {
 *    // Your code
 * }
 * ```
 * ```js
 * function test(a, b) {
 *    if (typeof a !== "string") throw new Error("`a` must be of type `string`.");
 *    else if (b !== undefined && typeof b !== "number") throw new TypeError("`b` must be of type `number`.");
 *    // Your code
 * }
 * ```
 */
//@ts-expect-error Unused ErrorType
//eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Assert<T, ErrorType = Error> = T | T & { __marker: "Assert" };

/**
 * Validates if the value is a number and if it's between the specified range.
 * 
 * @example
 * ```ts
 * const someNum = data.num as Assert<Range<1, 10>>;
 * ```
 * ```js
 * const __data = data.num;
 * if (typeof __data !== "number" || (c < 1 || c > 10)) throw new Error("Expected data.num to be Range<1, 10>.");
 * const someNum = __data;
 * ```
 */
//@ts-expect-error Unused params
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Range<min extends number, max extends number> = number & number & { __marker?: "Range" }; 

/**
 * Does not validate the type inside the marker.
 */
export type NoCheck<T> = T & T & { __marker?: "NoCheck" };

/**
 * Validates if the provided value is a string and it matches the regex.
 * 
 * @example
 * ```ts
 * function test(a: Assert<Matches<"/abc/">>) {
 *   // Your code...
 * }
 * ```
 * ```js
 * function test(a) {
 *    if (typeof a !== "string" || !/abc/.test(a)) throw new Error("Expected a to be Matches<\"/abc/\">.");
 *    // Your code...
 * }
 * ```
 */
//@ts-expect-error Unused params
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Matches<Regex extends string> = string & string & { __marker?: "Matches" };

/**
 * Validates whether the value doesn't have any excessive properties.   
 * 
 * **Note:** This marker generates an if loop that goes over each property of the value,
 * so you might not want to use it if your object is big.
 * 
 * @example
 * ```ts
 * function test(a: Assert<ExactProps<{a: number, b: string}>>) {
 *   // Your code...
 * }
 * ```
 * ```js
 * function test2(prop) {
 *  if (typeof prop !== "object") throw new Error("Expected prop to be { a: number; b: string; }.");
 *  if (typeof prop["a"] !== "number") throw new Error("Expected prop.a to be number.");
 *  if (typeof prop["b"] !== "string") throw new Error("Expected prop.b to be string.");
 *  for (let name_2 in prop) {
 *      if (name_2 !== "a" && name_2 !== "b") throw new Error("Property " + ("prop[" + name_2 + "]") + " is excessive.");
 *   }
 * }
 * ```
 */
export type ExactProps<Obj extends object> = Obj & Obj & { __marker?: "ExactProps" };