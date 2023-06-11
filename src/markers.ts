/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import * as Block from "./block";
import { Transformer } from "./transformer";
import { genArrayPush, isErrorMessage } from "./utils";
import { validate, ValidationContext } from "./validation";
import { validateType } from "./gen/nodes";
import { ValidationResultType } from "./validation/context";
import { genIdentifier, UNDEFINED } from "./utils";
import { genValidator } from "./gen/validators";


export const enum MacroCallContext {
    As,
    Parameter
}

export interface MarkerCallData {
    parameters: Array<ts.Type>,
    block: Block.Block<unknown>,
    ctx: MacroCallContext,
    optional?: boolean,
    exp: ts.Expression | ts.BindingName,
    resultType?: ValidationResultType
}

export interface FnCallData {
    block: Block.Block<unknown>,
    prevBlock: Block.Block<unknown>,
    call: ts.CallExpression,
    type: ts.Type
}

export type MarkerFn = (transformer: Transformer, data: MarkerCallData) => ts.Expression|undefined;
export type FnCallFn = (transformer: Transformer, data: FnCallData) => void;

export const Markers: Record<string, MarkerFn> = {
    Assert: (trans, {ctx, exp, block, parameters, optional}) => {
        if (ctx === MacroCallContext.Parameter) {
            block.nodes.push(...genValidateForProp(exp, (i, patternType) => {
                const validator = genValidator(trans, patternType !== undefined ? trans.checker.getTypeAtLocation(i) : parameters[0]!, ts.isIdentifier(i) ? i.text : i.getText(), i);
                if (!validator) return [];
                return validateType(validator, {
                    errorTypeName: parameters[1]?.symbol?.name || "Error",
                    resultType: { throw: true },
                    transformer: trans
                }, optional);
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

export const Functions: Record<string, FnCallFn> = {
    is: (transformer, data) => {
        let arg = data.call.arguments[0]!;
        if (!ts.isIdentifier(arg)) {
            const [stmt, newArg] = genIdentifier("temp", arg, ts.NodeFlags.Const);
            arg = newArg;
            data.block.nodes.push(stmt);
        }
        data.block.nodes.push(...validate(data.type, arg, new ValidationContext({
            resultType: { return: ts.factory.createFalse() },
            transformer,
            depth: [],
            propName: arg.pos === -1 ? "value" : arg.getText()
        })), ts.factory.createReturnStatement(ts.factory.createTrue()));
    },
    check: (transformer, data) => {
        let dataVariable: ts.Identifier;
        let arrVariable: ts.Identifier;
        let dataInitialize, arrIntitialize;
        let block = data.block;
        if (ts.isVariableDeclaration(data.call.parent) && ts.isArrayBindingPattern(data.call.parent.name)) {
            const name = data.call.parent.name;
            if (name.elements[0] && ts.isBindingElement(name.elements[0]) && ts.isIdentifier(name.elements[0].name)) {
                dataVariable = name.elements[0].name;
                dataInitialize = genIdentifier(dataVariable, data.call.arguments[0], ts.NodeFlags.Const)[0];
            }
            else {
                if (!ts.isIdentifier(data.call.arguments[0]!)) [dataInitialize, dataVariable] = genIdentifier("temp", data.call.arguments[0], ts.NodeFlags.Const);
                else dataVariable = data.call.arguments[0]!;
            }
            if (name.elements[1] && ts.isBindingElement(name.elements[1]) && ts.isIdentifier(name.elements[1].name)) {
                arrVariable = name.elements[1].name;
                arrIntitialize = genIdentifier(arrVariable!, ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const)[0];
            } else {
                [arrIntitialize, arrVariable] = genIdentifier("temp", ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const);
            }
            block = data.prevBlock;
            Block.listen(block, () => block.nodes.pop());
        } else {
            if (!ts.isIdentifier(data.call.arguments[0]!)) [dataInitialize, dataVariable] = genIdentifier("temp", data.call.arguments[0], ts.NodeFlags.Const);
            else dataVariable = data.call.arguments[0]!;
            [arrIntitialize, arrVariable] = genIdentifier("temp", ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const);
        }
        if (dataInitialize) block.nodes.push(dataInitialize);
        block.nodes.push(arrIntitialize);
        block.nodes.push(...validate(data.type, dataVariable, new ValidationContext({
            resultType: {
                custom: (msg) => ts.factory.createExpressionStatement(genArrayPush(arrVariable, msg))
            },
            transformer,
            depth: [],
            propName: dataVariable.pos === -1 ? "value" : dataVariable.getText()
        })));
        if (block === data.block) block.nodes.push(ts.factory.createArrayLiteralExpression([dataVariable, arrVariable]));
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

export type Str<Settings extends {
    length?: number|Expr<"">,
    minLen?: number|Expr<"">,
    maxLen?: number|Expr<"">,
    matches?: string|Expr<"">
}> = string & { __utility?: Str<Settings> };

export type Num<Settings extends {
    min?: number|Expr<"">,
    max?: number|Expr<"">,
    type?: "int" | "float"
}> = number & { __utility?: Num<Settings> };

export type Arr<T, Settings extends {
    length?: number|Expr<"">,
    minLen?: number|Expr<"">,
    maxLen?: number|Expr<"">
}> = Array<T> & { __utility?: Arr<T, Settings> };

/**
 * Does not validate the type inside the marker.
 */
export type NoCheck<T> = T & { __utility?: NoCheck<T> };

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
export type ExactProps<Obj extends object, removeExcessive extends boolean = false> = Obj & { __utility?: ExactProps<Obj, removeExcessive> };

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function is<T, _M = { __marker: "is" }>(prop: unknown) : prop is T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function check<T, _M = { __marker: "check" }>(prop: unknown) : [T, Array<string>];