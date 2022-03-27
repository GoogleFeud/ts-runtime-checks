/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
    exp: ts.BindingName
}

export type MacroFn = (transformer: Transformer, data: MarkerCallData) => ts.Node|undefined;

export const Markers: Record<string, MacroFn> = {
    Assert: (trans, {ctx, exp, block, parameters, optional}) => {
        if (ctx === MacroCallContext.Parameter) {
            block.nodes.push(...genValidateForProp(exp, (i, patternType) => {
                return validate(patternType !== undefined ? trans.checker.getTypeAtLocation(i) : parameters[0]!, i, new ValidationContext({
                    errorTypeName: parameters[1]?.symbol?.name,
                    checker: trans.checker,
                    depth: [],
                    propName: i.text
                }), optional);
            }));
            return undefined;
        } else return undefined;
    }
};

export const enum BindingPatternTypes {
    Object,
    Array
}

function genValidateForProp(prop: ts.BindingName, 
    cb: (i: ts.Identifier, bindingPatternType?: BindingPatternTypes) => Array<ts.Statement>,
    parentType?: BindingPatternTypes) : Array<ts.Statement> {
    if (ts.isIdentifier(prop)) return cb(prop, parentType);
    else if (ts.isObjectBindingPattern(prop)) {
        const result = [];
        for (const el of prop.elements) {
            result.push(...genValidateForProp(el.name, cb, BindingPatternTypes.Object));
        }
        return result;
    } else if (ts.isArrayBindingPattern(prop)) {
        const result = [];
        for (const el of prop.elements) {
            if (ts.isOmittedExpression(el)) continue;
            result.push(...genValidateForProp(el.name, cb, BindingPatternTypes.Array));
        }
        return result;
    }
    else return [];
}

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
 * 
 * ```js
 * // Generated code:
 * const __data = data.num;
 * if (typeof __data !== "number" || (c < 1 || c > 10)) throw new Error("Expected data.num to be Range<1, 10>.");
 * const someNum = __data;
 * ```
 * ```ts
 * //Sets only the max
 * const someNum = data.num as Assert<Range<number, 10>>;
 * ```
 * ```js
 * // Generated code:
 * const __data = data.num;
 * if (typeof __data !== "number" || c > 10) throw new Error("Expected data.num to be Range<number, 10>.");
 * const someNum = __data;
 * ```
 */
//@ts-expect-error Unused params
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Range<min extends number, max extends number> = number & { __marker?: "Range" }; 

/**
 * Does not validate the type inside the marker.
 */
export type NoCheck<T> = T & { __marker?: "NoCheck" };

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
export type Matches<Regex extends string> = string & { __marker?: "Matches" };

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
export type ExactProps<Obj extends object> = Obj & { __marker?: "ExactProps" };


export type Var<Name extends string> = Name | { __marker?: "Var" };

/**
 * Checks if `Obj`[`Key`] === `Value`. It does **not** check if any other properties of the object
 * are correct by default. You can provide set the `CorrectOthers` parameter to true to enable that.
 */
//@ts-expect-error Unused params
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type CmpKey<Obj extends object, Key extends keyof Obj, Value, CorrectOthers extends boolean = false> = Obj & { __marker?: "CmpKey" }