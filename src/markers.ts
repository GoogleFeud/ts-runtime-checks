/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import { Block } from "./block";
import { Transformer } from "./transformer";
import { isErrorMessage } from "./utils";
import { validate, ValidationContext } from "./validation";
import { genIdentifier, UNDEFINED } from "./validation/utils";

export const enum MacroCallContext {
    As,
    Parameter
}

export interface MarkerCallData {
    parameters: Array<ts.Type>,
    block: Block<unknown>,
    ctx: MacroCallContext,
    optional?: boolean,
    exp: ts.Expression | ts.BindingName
}

export type MacroFn = (transformer: Transformer, data: MarkerCallData) => ts.Expression|undefined;

export const Markers: Record<string, MacroFn> = {
    Assert: (trans, {ctx, exp, block, parameters, optional}) => {
        if (ctx === MacroCallContext.Parameter) {
            block.nodes.push(...genValidateForProp(exp, (i, patternType) => {
                return validate(patternType !== undefined ? trans.checker.getTypeAtLocation(i) : parameters[0]!, i, new ValidationContext({
                    errorTypeName: parameters[1]?.symbol?.name,
                    transformer: trans,
                    depth: [],
                    propName: ts.isIdentifier(i) ? i.text : i
                }), optional);
            }));
            return undefined;
        } else {
            let callBy = exp as ts.Expression;
            if (!ts.isIdentifier(callBy) && !ts.isPropertyAccessExpression(callBy) && !ts.isElementAccessExpression(callBy)) {
                const [decl, ident] = genIdentifier("temp", callBy as ts.Expression, ts.NodeFlags.Const);
                block.nodes.push(decl);
                callBy = ident;
            }
            block.nodes.push(...validate(parameters[0]!, callBy, new ValidationContext({
                errorTypeName: parameters[1]?.symbol?.name,
                transformer: trans,
                depth: [],
                propName: callBy.pos === -1 ? "value" : callBy.getText()
            })));
            return callBy;
        }
    },
    EarlyReturn: (trans, { ctx, exp, block, parameters, optional}) => {
        const resultType = parameters[1] ? isErrorMessage(parameters[1]) ? { returnErr: true } : { return: trans.typeValueToNode(parameters[1], true) } : { return: UNDEFINED };
        if (ctx === MacroCallContext.Parameter) {
            block.nodes.push(...genValidateForProp(exp, (i, patternType) => {
                return validate(patternType !== undefined ? trans.checker.getTypeAtLocation(i) : parameters[0]!, i, new ValidationContext({
                    resultType,
                    transformer: trans,
                    depth: [],
                    propName: ts.isIdentifier(i) ? i.text : i
                }), optional);
            }));
            return undefined;
        } else {
            let callBy = exp as ts.Expression;
            if (!ts.isIdentifier(callBy) && !ts.isPropertyAccessExpression(callBy) && !ts.isElementAccessExpression(callBy)) {
                const [decl, ident] = genIdentifier("temp", callBy as ts.Expression, ts.NodeFlags.Const);
                block.nodes.push(decl);
                callBy = ident;
            }
            block.nodes.push(...validate(parameters[0]!, callBy, new ValidationContext({
                resultType,
                transformer: trans,
                depth: [],
                propName: callBy.pos === -1 ? "value" : callBy.getText()
            })));
            return callBy;
        }
    }
};

export const enum BindingPatternTypes {
    Object,
    Array
}

function genValidateForProp(prop: ts.Expression|ts.BindingName, 
    cb: (i: ts.Expression, bindingPatternType?: BindingPatternTypes) => Array<ts.Statement>,
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
    else return cb(prop);
}

/**
 * Makes sure the value matches the provided type by generating code which validates the value. 
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
export type Assert<T, ErrorType = Error> = T & { __marker?: Assert<T, ErrorType> };

/**
 * Makes sure the value matches the provided type by generating code which validates the value. Returns the provided
 * `ReturnValue` (or `undefiend` if a return value is not provided) if the value doesn't match the type. 
 * You can provide the `ErrorMsg` type to make it return the error strings.
 * 
 * This marker can be used in function parameters and in the the `as` expression.
 * 
 * @example
 * ```ts
 * function test(a: EarlyReturn<string>, b?: EarlyReturn<number, "Expected b to be number...">) {
 *    // Your code
 * }
 * ```
 * ```js
 * function test(a, b) {
 *   if (typeof a !== "string") return;
 *   else if (b !== undefined && typeof b !== "number") return "Expected b to be number...";
 *   // Your code
 * }
 * ```
 */
export type EarlyReturn<T, ReturnValue = undefined> = T & { __marker?: EarlyReturn<T, ReturnValue> };
export type ErrorMsg = { __error_msg: true }

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
export type Range<min extends number|Expr<"">, max extends number|Expr<"">> = number & { __utility?: Range<min, max> }; 

/**
 * Does not validate the type inside the marker.
 */
export type NoCheck<T> = T & { __utility?: NoCheck<T> };

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
export type Matches<Regex extends string|Expr<"">> = string & { __utility?: Matches<Regex> };

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
export type ExactProps<Obj extends object> = Obj & { __utility?: ExactProps<Obj> };

export type Expr<Expression extends string> = { __utility?: Expr<Expression> };

/**
 * Allows you to create custom comparisons. You can use `$self` in `Expression` - it will turn to value 
 * that's currently being validated. If `FullCheck` is set to false, then any additional checks regarding the
 * type of the value will **not** be generated.
 * 
 * @example
 * ```ts
 * type Assert123 = Assert<If<{a: number, b: string}, "$self.a === 123", true>>;
 *
 *  function test(a?: Assert123) {
 *    return a;
 *  }
 * ```
 * ```js
 * function text(a) {
 *   if (a !== undefined) {
 *       if (typeof a !== "object") throw new Error("Expected a to be { a: number; b: string; }.");
 *       if (typeof a["a"] !== "number") throw new Error("Expected a.a to be number.");
 *       if (typeof a["b"] !== "string") throw new Error("Expected a.b to be string.");
 *       if (a.a !== 123) throw new Error("Expected a to satisfy `self.a === 123`.");
 *   }
 *   return a;
 * }
 * ```
 */
export type If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };

/**
 * Utility function. It's calls get transpiled to a self-invoked arrow function which returns `true` if the value matches the type, `false` otherwise.
 * This is basically a tiny wrapper of the `EarlyReturn` type.
 * 
 * @example
 * ```ts
 * interface Args {
 *   name: string,
 *   path: string,
 *   output: string,
 *   clusters?: number
 *  }
 *
 * console.log(is<Range<1, 10>>(123));
 * ```
 * ```js
 * console.log((() => {
 *   const temp_1 = 123;
 *   if (typeof temp_1 !== "number" || (temp_1 < 1 || temp_1 > 10))
 *       return false;
 *   return true;
 * })());
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function is<T, _M = { __is: true }>(prop: unknown) : prop is T;