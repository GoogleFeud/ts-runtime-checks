/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from "typescript";
import * as Block from "./block";
import { Transformer } from "./transformer";
import { forEachVar, getCallSigFromType, resolveResultType } from "./utils";
import { ValidationResultType, genNode, validateType } from "./gen/nodes";
import { genValidator, ResolveTypeData, TypeDataKinds, Validator, ValidatorTargetName } from "./gen/validators";
import { _access, _call, _not, _var } from "./gen/expressionUtils";

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
}

export interface FnCallData {
    block: Block.Block<unknown>,
    prevBlock: Block.Block<unknown>,
    call: ts.CallExpression,
    type: ts.Type
}

export type MarkerFn = (transformer: Transformer, data: MarkerCallData) => ts.Expression|undefined;
export type FnCallFn = (transformer: Transformer, data: FnCallData) => ts.Expression|void;

export const Markers: Record<string, MarkerFn> = {
    Assert: (trans, {ctx, exp, block, parameters, optional}) => {
        const resultType = resolveResultType(trans, parameters[1]);
        if (ctx === MacroCallContext.Parameter) {
            block.nodes.push(...forEachVar(exp, (i, patternType) => {
                const validator = createValidator(trans, patternType !== undefined ? trans.checker.getTypeAtLocation(i) : parameters[0]!, ts.isIdentifier(i) ? i.text : i.getText(), i, resultType, optional);
                if (!validator) return [];
                return validateType(validator, {
                    resultType,
                    transformer: trans
                }, optional);
            }));
            return;
        } else {
            let callBy = exp as ts.Expression;
            if (!ts.isIdentifier(callBy) && !ts.isPropertyAccessExpression(callBy) && !ts.isElementAccessExpression(callBy)) {
                const [decl, ident] = _var("value", callBy as ts.Expression, ts.NodeFlags.Const);
                block.nodes.push(decl);
                callBy = ident;
            }
            const validator = createValidator(trans, parameters[0]!, ts.isIdentifier(callBy) ? callBy.text : callBy.getText(), callBy, resultType, optional);
            if (!validator) return;
            block.nodes.push(...validateType(validator, {
                transformer: trans,
                resultType
            }));
            return callBy;
        }
    }
};

export const Functions: Record<string, FnCallFn> = {
    is: (transformer, data) => {
        let arg = data.call.arguments[0]!, stmt;
        if (!ts.isIdentifier(arg)) [stmt, arg] = _var("value", arg, ts.NodeFlags.Const);
        const validator = genValidator(transformer, data.type, ts.isIdentifier(arg) ? arg.text : arg.getText(), arg);
        if (!validator) return;
        const nodes = genNode(validator, { transformer, resultType: { none: true }});
        if (!nodes.extra && !nodes.ifFalse && !nodes.ifTrue) {
            if (stmt) (data.block.parent || data.block).nodes.push(stmt);
            return _not(nodes.condition);
        } else {
            data.block.nodes.push(stmt, ...validateType(validator, {
                resultType: { return: ts.factory.createFalse() },
                transformer
            }), ts.factory.createReturnStatement(ts.factory.createTrue()));
            return;
        }
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
                dataInitialize = _var(dataVariable, data.call.arguments[0], ts.NodeFlags.Const)[0];
            }
            else {
                if (!ts.isIdentifier(data.call.arguments[0]!)) [dataInitialize, dataVariable] = _var("value", data.call.arguments[0], ts.NodeFlags.Const);
                else dataVariable = data.call.arguments[0]!;
            }
            if (name.elements[1] && ts.isBindingElement(name.elements[1]) && ts.isIdentifier(name.elements[1].name)) {
                arrVariable = name.elements[1].name;
                arrIntitialize = _var(arrVariable!, ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const)[0];
            } else {
                [arrIntitialize, arrVariable] = _var("value", ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const);
            }
            block = data.prevBlock;
            Block.listen(block, () => block.nodes.pop());
        } else {
            if (!ts.isIdentifier(data.call.arguments[0]!)) [dataInitialize, dataVariable] = _var("value", data.call.arguments[0], ts.NodeFlags.Const);
            else dataVariable = data.call.arguments[0]!;
            [arrIntitialize, arrVariable] = _var("value", ts.factory.createArrayLiteralExpression(), ts.NodeFlags.Const);
        }
        if (dataInitialize) block.nodes.push(dataInitialize);
        block.nodes.push(arrIntitialize);
        const validator = genValidator(transformer, data.type, dataVariable.text, dataVariable);
        if (!validator) return;
        block.nodes.push(...validateType(validator, {
            resultType: {
                custom: (msg) => ts.factory.createExpressionStatement(_call(_access(arrVariable, "push"), [msg]))
            },
            transformer,
        }));
        if (block === data.block) block.nodes.push(ts.factory.createReturnStatement(ts.factory.createArrayLiteralExpression([dataVariable, arrVariable])));
    }
};

function createValidator(transformer: Transformer, type: ts.Type, name: ValidatorTargetName, exp: ts.Expression, resultType: ValidationResultType, optional?: boolean) : Validator|undefined {
    const validator = genValidator(transformer, type, name, exp);
    if (!validator) return;
    const resolveTypes = validator.getChildrenOfKind(TypeDataKinds.Resolve);
    if (resolveTypes.length) {
        const callSig = getCallSigFromType(transformer.checker, ((resolveTypes[0] as Validator).typeData as ResolveTypeData).type);
        if (callSig) {
            const toBeResolved = transformer.toBeResolved.get(callSig.declaration as ts.CallSignatureDeclaration);
            if (toBeResolved) toBeResolved.push({
                validators: resolveTypes,
                optional,
                top: validator,
                resultType
            });
            else transformer.toBeResolved.set(callSig.declaration as ts.CallSignatureDeclaration, [{
                validators: resolveTypes,
                optional,
                top: validator,
                resultType
            }]);
            return;
        }
    }
    return validator;
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
export type Assert<T, ReturnValue = ThrowError<Error>> = T & { __marker?: Assert<T, ReturnValue> };
export type ErrorMsg = { __error_msg: true }
export type ThrowError<ErrorType = Error> = { __throw_err: ErrorType }

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
export type ExactProps<Obj extends object, removeExcessive = false, useDeleteOperator = false> = Obj & { __utility?: ExactProps<Obj, removeExcessive, useDeleteOperator> };

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
 * You can use this utility type on type parameters - the transformer is going to go through all call locations of the function the type parameter belongs to, figure out the actual type used, create a union of all the possible types and validate it.
 * 
 * ```ts
 * export const validate = <Body>(req: { body: Body }) => {
 *    const [body, errors] = check<Infer<Body>>(req.body);
 * };
 *
 * // in fileA.ts
 * validate({
 *   body: { a: "hello" }
 * });
 *
 * // in FileB.ts
 * validate({
 *   body: { something: true, a: 123 }
 * });
 *
 * // Transpiles to:
 * const validate = (req) => {
 *   const body = req.body;
 *   const errors = [];
 *   if (typeof body !== "object" && body !== null)
 *       errors.push("Expected body to be an object");
 *   if (typeof body.a !== "string" && typeof body.a !== "number")
 *       errors.push("Expected body to be one of string, number");
 *   if (typeof body.something !== "boolean")
 *       errors.push("Expected body.something to be a boolean");
 * };
``` 
 */
export type Infer<Type> = Type & { __utility?: Infer<Type> };

/**
 * Pass a type parameter to `Resolve<Type>` to *move* the validation logic to the call site, where the type parameter is resolved to an actual type.
 *
 * Currently, this marker has some limitations:
 * - Can only be used in `Assert` markers (so you can't use it in `check` or `is`).
 * - If used in a parameter declaration, the parameter name **has** to be an identifier (no deconstructions).
 * - Cannot be used on rest parameters.
 *
 * ```ts
 * function validateBody<T>(data: Assert<{ body: Resolve<T> }>) {
 *    return data.body;
 * }
 *
 * const validatedBody = validateBody<{
 *   name: string,
 *   other: boolean
 * }>({ body: JSON.parse(process.argv[2]) });
 *
 * // Transpiles to:
 * function validateBody(data) {
 *    return data.body;
 * }
 * 
 * const validatedBody = (() => {
 *   const data = { body: JSON.parse(process.argv[2]) };
 *   if (typeof data.body !== "object" && data.body !== null)
 *       throw new Error("Expected data.body to be an object");
 *   if (typeof data.body.name !== "string")
 *       throw new Error("Expected data.body.name to be a string");
 *   if (typeof data.body.other !== "boolean")
 *       throw new Error("Expected data.body.other to be a boolean");
 *   return validateBody(data);
 * })();
```
 */
export type Resolve<Type> = Type & { __utility?: Resolve<Type> };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function is<T, _M = { __marker: "is" }>(prop: unknown) : prop is T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare function check<T, _M = { __marker: "check" }>(prop: unknown) : [T, Array<string>];