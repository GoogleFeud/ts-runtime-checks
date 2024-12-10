import ts from "typescript";
import {isInt} from "../utils";

const factory = ts.factory;

export type Stringifyable = string | ts.Expression;
export type BlockLike = ts.Expression | ts.Statement | ts.Block | ts.Statement[];

export function concat(strings: TemplateStringsArray, ...elements: Stringifyable[]): ts.Expression[] {
    const finalElements: Stringifyable[] = [];
    for (let i = 0; i < strings.length; i++) {
        finalElements.push(strings[i] as string);
        if (i < elements.length) finalElements.push(elements[i] as Stringifyable);
    }
    return joinElements(finalElements);
}

export function joinElements(elements: Stringifyable[], separator = ""): ts.Expression[] {
    const output: ts.Expression[] = [];
    for (const element of elements) {
        const lastElement = output[output.length - 1];
        const currentElementText = typeof element === "string" ? element : ts.isStringLiteral(element) || ts.isNumericLiteral(element) ? element.text : undefined;
        if (currentElementText === "") continue;
        if (lastElement && (ts.isStringLiteral(lastElement) || ts.isNumericLiteral(lastElement))) {
            if (currentElementText !== undefined) output[output.length - 1] = _str(lastElement.text + separator + currentElementText);
            else {
                if (separator) output[output.length - 1] = _str(lastElement.text + separator);
                output.push(element as ts.Expression);
            }
        } else {
            if (currentElementText !== undefined) output.push(_str(lastElement ? separator + currentElementText : "" + currentElementText));
            else {
                if (separator && lastElement) output.push(_str(separator));
                output.push(element as ts.Expression);
            }
        }
    }
    return output;
}

export function _stmt(stmt: BlockLike): ts.Statement {
    if (Array.isArray(stmt)) return factory.createBlock(stmt);
    else if (ts.isBlock(stmt)) return stmt;
    else if (stmt.kind > ts.SyntaxKind.EmptyStatement && stmt.kind < ts.SyntaxKind.DebuggerStatement) return stmt as ts.Statement;
    else return factory.createExpressionStatement(stmt as ts.Expression);
}

export function _concise(stmt: BlockLike): ts.ConciseBody {
    if (Array.isArray(stmt)) return factory.createBlock(stmt);
    else if (ts.isBlock(stmt)) return stmt;
    else if (stmt.kind > ts.SyntaxKind.EmptyStatement && stmt.kind < ts.SyntaxKind.DebuggerStatement) return factory.createBlock([stmt as ts.Statement]);
    else return stmt as ts.Expression;
}

export function _if(condition: ts.Expression, ifTrue: BlockLike, ifFalse?: BlockLike): ts.IfStatement {
    return factory.createIfStatement(condition, _stmt(ifTrue), ifFalse ? _stmt(ifFalse) : undefined);
}

export function _if_chain(ind: number, check: [ts.Expression, BlockLike][], last?: BlockLike): ts.Statement | undefined {
    if (ind >= check.length) return last ? _stmt(last) : undefined;
    return factory.createIfStatement(check[ind]![0], _stmt(check[ind]![1]), _if_chain(ind + 1, check, last));
}

export function _if_nest(ind: number, check: [ts.Expression, BlockLike][], last: ts.Statement): ts.Statement {
    if (ind >= check.length) return last;
    return factory.createIfStatement(check[ind]![0], _if_nest(ind + 1, check, last), _stmt(check[ind]![1]));
}

export function _var(name: ts.BindingName | string, initializer?: ts.Expression, flag = ts.NodeFlags.Let): [ts.VariableStatement, ts.Identifier | ts.Identifier] {
    const ident = typeof name === "string" ? factory.createUniqueName(name) : name;
    return [
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(ident, undefined, undefined, initializer)], flag)),
        ident as ts.Identifier
    ];
}

export function _ident(name: string | ts.Identifier, nonUnique?: boolean, normalize?: boolean): ts.Identifier {
    if (typeof name !== "string") return name;
    if (normalize) name = _normalizeJsName(name);
    return nonUnique ? factory.createIdentifier(name) : factory.createUniqueName(name);
}

export function _bin(left: ts.Expression, right: ts.Expression, op: ts.BinaryOperator): ts.Expression {
    return ts.factory.createBinaryExpression(left, op, right);
}

export function _typeof_cmp(left: ts.Expression, type: string, op: ts.BinaryOperator = ts.SyntaxKind.EqualsEqualsEqualsToken) {
    return factory.createBinaryExpression(factory.createTypeOfExpression(left), op, factory.createStringLiteral(type));
}

export function _bin_chain(exps: ts.Expression[], op: ts.BinaryOperator): ts.Expression {
    if (exps.length === 1) return exps[0] as ts.Expression;
    let start = factory.createBinaryExpression(exps[0] as ts.Expression, op, exps[1] as ts.Expression);
    for (let i = 2; i < exps.length; i++) {
        start = factory.createBinaryExpression(start, op, exps[i] as ts.Expression);
    }
    return start;
}

export function _and(exps: ts.Expression[]): ts.Expression {
    return _bin_chain(exps, ts.SyntaxKind.AmpersandAmpersandToken);
}

export function _or(exps: ts.Expression[]): ts.Expression {
    return _bin_chain(exps, ts.SyntaxKind.BarBarToken);
}

export function _throw(exp: ts.Expression): ts.Statement {
    return factory.createThrowStatement(exp);
}

export function _str(string: string): ts.StringLiteral {
    return factory.createStringLiteral(string);
}

export function _num(number: number): ts.Expression {
    if (number < 0) return factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, ts.factory.createNumericLiteral(Math.abs(number)));
    return factory.createNumericLiteral(number);
}

export function _bool(bool: boolean): ts.Expression {
    return bool ? factory.createTrue() : factory.createFalse();
}

export function _obj_check(obj: ts.Expression, skipNullCheck?: boolean): ts.Expression {
    if (skipNullCheck) return _typeof_cmp(obj, "object", ts.SyntaxKind.ExclamationEqualsEqualsToken);
    else return _or([_typeof_cmp(obj, "object", ts.SyntaxKind.ExclamationEqualsEqualsToken), _bin(obj, ts.factory.createNull(), ts.SyntaxKind.EqualsEqualsEqualsToken)]);
}

export function _arr_check(arr: ts.Expression): ts.Expression {
    return _call(_access(_ident("Array", true), "isArray"), [arr]);
}

export function _new(className: string | ts.Identifier, parameters: string | ts.Expression[]): ts.Expression {
    return factory.createNewExpression(_ident(className, true), undefined, typeof parameters === "string" ? [factory.createStringLiteral(parameters)] : parameters);
}

export function _instanceof(exp: ts.Expression, inst: string | ts.Identifier): ts.Expression {
    return factory.createBinaryExpression(exp, ts.SyntaxKind.InstanceOfKeyword, typeof inst === "string" ? factory.createIdentifier(inst) : inst);
}

export function _not(exp: ts.Expression): ts.Expression {
    if (ts.isParenthesizedExpression(exp)) return ts.factory.createParenthesizedExpression(_not(exp.expression));
    else if (ts.isBinaryExpression(exp)) {
        switch (exp.operatorToken.kind) {
            case ts.SyntaxKind.EqualsEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.ExclamationEqualsToken, exp.right);
            case ts.SyntaxKind.ExclamationEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.EqualsEqualsToken, exp.right);
            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.ExclamationEqualsEqualsToken, exp.right);
            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.EqualsEqualsEqualsToken, exp.right);
            case ts.SyntaxKind.GreaterThanToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.LessThanEqualsToken, exp.right);
            case ts.SyntaxKind.GreaterThanEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.LessThanToken, exp.right);
            case ts.SyntaxKind.LessThanToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.GreaterThanEqualsToken, exp.right);
            case ts.SyntaxKind.LessThanEqualsToken:
                return factory.createBinaryExpression(exp.left, ts.SyntaxKind.GreaterThanToken, exp.right);
            case ts.SyntaxKind.AmpersandAmpersandToken:
                return factory.createBinaryExpression(_not(exp.left), ts.SyntaxKind.BarBarToken, _not(exp.right));
            case ts.SyntaxKind.BarBarToken:
                return factory.createBinaryExpression(_not(exp.left), ts.SyntaxKind.AmpersandAmpersandToken, _not(exp.right));
            default:
                return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
        }
    } else if (ts.isPrefixUnaryExpression(exp) && exp.operator === ts.SyntaxKind.ExclamationToken) return exp.operand;
    return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
}

export function _access(exp: ts.Expression, key: string | number | ts.Expression, isStringWrapped?: boolean): ts.Expression {
    if (typeof key === "string") {
        if (isInt(key)) return factory.createElementAccessExpression(exp, ts.factory.createNumericLiteral(key));
        else if (isStringWrapped) return ts.factory.createElementAccessExpression(exp, ts.factory.createStringLiteral(key));
        else return ts.factory.createPropertyAccessExpression(exp, key);
    } else return factory.createElementAccessExpression(exp, key);
}

export function _call(exp: ts.Expression, args: ts.Expression[]): ts.Expression {
    return factory.createCallExpression(exp, undefined, args);
}

export function _for(arr: ts.Expression, indName: ts.Identifier | string, body: BlockLike, arrayExp?: ts.Expression): [loop: ts.Statement, index: ts.Expression] {
    const [initializerCreate, initializer] = _var(indName, factory.createNumericLiteral(0));
    return [
        factory.createForStatement(
            initializerCreate.declarationList,
            factory.createBinaryExpression(initializer, ts.SyntaxKind.LessThanToken, arrayExp || factory.createPropertyAccessExpression(arr, "length")),
            factory.createPostfixIncrement(initializer),
            _stmt(body)
        ),
        initializer
    ];
}

export function _for_in(arr: ts.Expression, elName: ts.Identifier | string, body: BlockLike): [loop: ts.Statement, variable: ts.Identifier] {
    const [initializerCreate, initializer] = _var(elName);
    return [factory.createForInStatement(initializerCreate.declarationList, arr, _stmt(body)), initializer];
}

export function _val(val: unknown): ts.Expression {
    if (typeof val === "string") return _str(val);
    else if (typeof val === "number") return _num(val);
    else if (val === true) return _bool(true);
    else if (val === false) return _bool(false);
    else if (Array.isArray(val)) return _arr(val);
    else if (val === null) return ts.factory.createNull();
    else if (typeof val === "object") {
        if ("kind" in val && "pos" in val) return val as ts.Expression;
        else return _obj(val as Record<string, unknown>);
    } else return UNDEFINED;
}

export function _arr(array: Array<unknown>): ts.Expression {
    return ts.factory.createArrayLiteralExpression(array.map(val => _val(val)));
}

export function _obj(props: Record<string | number | symbol, unknown>): ts.Expression {
    const propNodes: ts.PropertyAssignment[] = [];
    for (const property in props) {
        if (typeof property !== "string") continue;
        const value = _val(props[property]);
        if (value.kind === ts.SyntaxKind.UndefinedKeyword) continue;
        propNodes.push(factory.createPropertyAssignment(property, value));
    }
    return factory.createObjectLiteralExpression(propNodes);
}

export function _obj_binding_decl(elements: [string, ts.Identifier | undefined, boolean | undefined][], value: ts.Expression): ts.VariableDeclaration {
    const mappedBindingElements = elements.map(e =>
        factory.createBindingElement(
            undefined,
            // Property name
            e[1] ? (e[2] ? _str(e[0]) : e[0]) : undefined,
            // Alias
            e[1] ? e[1] : e[2] ? _normalizeJsName(e[0]) : e[0]
        )
    );
    return factory.createVariableDeclaration(factory.createObjectBindingPattern(mappedBindingElements), undefined, undefined, value);
}

export function _arr_binding_decl(elements: [number, ts.Identifier][], value: ts.Expression): ts.VariableDeclaration {
    const bindingEls = [];
    for (const el of elements) {
        bindingEls[el[0]] = factory.createBindingElement(undefined, undefined, el[1], undefined);
    }
    for (let i = 0; i < bindingEls.length; i++) {
        if (bindingEls[i] === undefined) bindingEls[i] = factory.createOmittedExpression();
    }
    return factory.createVariableDeclaration(factory.createArrayBindingPattern(bindingEls), undefined, undefined, value);
}

export function _ternary(cond: ts.Expression, ifTrue: ts.Expression, ifFalse: ts.Expression): ts.Expression {
    return factory.createConditionalExpression(cond, undefined, ifTrue, undefined, ifFalse);
}

export function _arrow_fn(args: Array<ts.Identifier | string>, body: BlockLike): ts.Expression {
    return factory.createArrowFunction(
        undefined,
        undefined,
        args.map(arg => ts.factory.createParameterDeclaration(undefined, undefined, _ident(arg))),
        undefined,
        undefined,
        _concise(body)
    );
}

export function _assign(left: ts.Expression, right: ts.Expression): ts.Expression {
    return factory.createAssignment(left, right);
}

export function _normalizeJsName(name: string): string {
    name = name.replace(/^[^a-zA-Z_$]/g, "_");
    return name.replace(/[^a-zA-Z0-9_$]/g, "_");
}

export const UNDEFINED = factory.createIdentifier("undefined");
