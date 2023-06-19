import ts, { factory } from "typescript";

export type Stringifyable = string | ts.Expression;
export type BlockLike = ts.Expression | ts.Statement | ts.Block | Array<ts.Statement>;

export function concat(strings: TemplateStringsArray, ...elements: Stringifyable[]) : ts.Expression[] {
    const finalElements: Stringifyable[] = [];
    for (let i=0; i < strings.length; i++) {
        finalElements.push(strings[i] as string);
        if (i < elements.length) finalElements.push(elements[i] as Stringifyable);
    }
    return joinElements(finalElements);
}

export function joinElements(elements: Stringifyable[], separator = "") : ts.Expression[] {
    const output: ts.Expression[] = [];
    for (const element of elements) {
        const lastElement = output[output.length - 1];
        const currentElementText = typeof element === "string" ? element : ts.isStringLiteral(element) || ts.isNumericLiteral(element) ? element.text : undefined;
        if (currentElementText === "") continue;
        if (lastElement && (ts.isStringLiteral(lastElement) || ts.isNumericLiteral(lastElement))) {
            if (currentElementText !== undefined) output[output.length - 1] = _str(lastElement.text + separator + currentElementText);
            else output.push(element as ts.Expression);
        } else {
            if (currentElementText !== undefined) output.push(_str(lastElement ? separator + currentElementText : "" + currentElementText));
            else output.push(element as ts.Expression);
        }
    }
    return output;
}

export function _stmt(stmt: BlockLike) : ts.Statement {
    if (Array.isArray(stmt)) return factory.createBlock(stmt);
    if (stmt.kind > ts.SyntaxKind.EmptyStatement && stmt.kind < ts.SyntaxKind.DebuggerStatement) return stmt as ts.Statement;
    else return factory.createExpressionStatement(stmt as ts.Expression);
}

export function _if(condition: ts.Expression, ifTrue: BlockLike, ifFalse?: BlockLike) : ts.IfStatement {
    return factory.createIfStatement(condition, _stmt(ifTrue), ifFalse ? _stmt(ifFalse) : undefined);
}

export function _if_chain(ind: number, check: [ts.Expression, BlockLike][], last?: ts.Statement) : ts.Statement | undefined {
    if (ind >= check.length) return last;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return factory.createIfStatement(check[ind]![0], _stmt(check[ind]![1]), _if_chain(ind + 1, check, last));
}

export function _if_nest(ind: number, check: [ts.Expression, BlockLike][], last: ts.Statement) : ts.Statement {
    if (ind >= check.length) return last;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return factory.createIfStatement(check[ind]![0], _if_nest(ind + 1, check, last), _stmt(check[ind]![1]));
}

export function _var(name: ts.Identifier | string, initializer?: ts.Expression, flag = ts.NodeFlags.Let) : [ts.VariableStatement, ts.Identifier] {
    const ident = typeof name === "string" ? factory.createUniqueName(name) : name;
    return [factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
        factory.createVariableDeclaration(ident, undefined, undefined, initializer),
    ], flag)), ident];
}

export function _ident(name: string) : ts.Identifier {
    return factory.createUniqueName(name);
}

export function _bin(left: ts.Expression, right: ts.Expression, op: ts.BinaryOperator) : ts.Expression {
    return ts.factory.createBinaryExpression(left, op, right);
}

export function _typeof_cmp(left: ts.Expression, type: string, op: ts.BinaryOperator = ts.SyntaxKind.EqualsEqualsEqualsToken) {
    return factory.createBinaryExpression(factory.createTypeOfExpression(left), op, factory.createStringLiteral(type));
}

export function _bin_chain(exps: ts.Expression[], op: ts.BinaryOperator) : ts.Expression {
    if (exps.length === 1) return exps[0] as ts.Expression;
    let start = factory.createBinaryExpression(exps[0] as ts.Expression, op, exps[1] as ts.Expression);
    for (let i=2; i < exps.length; i++) {
        start = factory.createBinaryExpression(start, op, exps[i] as ts.Expression);
    }
    return start;
}

export function _and(exps: ts.Expression[]) : ts.Expression {
    return _bin_chain(exps, ts.SyntaxKind.AmpersandAmpersandToken);
}

export function _or(exps: ts.Expression[]) : ts.Expression {
    return _bin_chain(exps, ts.SyntaxKind.BarBarToken);
}

export function _throw(exp: ts.Expression) : ts.Statement {
    return factory.createThrowStatement(exp);
}

export function _str(string: string) : ts.Expression {
    return factory.createStringLiteral(string);
}

export function _num(number: number) : ts.Expression {
    return factory.createNumericLiteral(number);
}

export function _new(className: string, parameters: string | ts.Expression[]) : ts.Expression {
    return factory.createNewExpression(
        factory.createIdentifier(className),
        undefined,
        typeof parameters === "string" ? [factory.createStringLiteral(parameters)] : parameters
    );
}

export function _instanceof(exp: ts.Expression, inst: string | ts.Identifier) : ts.Expression {
    return factory.createBinaryExpression(exp, ts.SyntaxKind.InstanceOfKeyword, typeof inst === "string" ? factory.createIdentifier(inst) : inst);
}

export function _not(exp: ts.Expression) : ts.Expression {
    if (ts.isParenthesizedExpression(exp)) return ts.factory.createParenthesizedExpression(_not(exp.expression));
    if (ts.isBinaryExpression(exp)) {
        switch(exp.operatorToken.kind) {
        case ts.SyntaxKind.EqualsEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.ExclamationEqualsToken, exp.right); 
        case ts.SyntaxKind.ExclamationEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.EqualsEqualsToken, exp.right);
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.ExclamationEqualsEqualsToken, exp.right); 
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.EqualsEqualsEqualsToken, exp.right);
        case ts.SyntaxKind.GreaterThanToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.LessThanToken, exp.right);
        case ts.SyntaxKind.GreaterThanEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.LessThanEqualsToken, exp.right);
        case ts.SyntaxKind.LessThanToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.GreaterThanToken, exp.right);
        case ts.SyntaxKind.LessThanEqualsToken:
            return factory.createBinaryExpression(exp.left, ts.SyntaxKind.GreaterThanEqualsToken, exp.right);
        case ts.SyntaxKind.AmpersandAmpersandToken:
            return factory.createBinaryExpression(_not(exp.left), ts.SyntaxKind.BarBarToken, _not(exp.right));
        case ts.SyntaxKind.BarBarToken:
            return factory.createBinaryExpression(_not(exp.left), ts.SyntaxKind.AmpersandAmpersandToken, _not(exp.right));
        }
    }
    else if (ts.isPrefixUnaryExpression(exp) && exp.operator === ts.SyntaxKind.ExclamationToken) return exp.operand;
    return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
}


export function _access(exp: ts.Expression, key: string | number | ts.Expression) : ts.Expression {
    if (typeof key === "string") return ts.factory.createPropertyAccessExpression(exp, key);
    else return factory.createElementAccessExpression(exp, key);
}

export function _call(exp: ts.Expression, args: ts.Expression[]) : ts.Expression {
    return factory.createCallExpression(exp, undefined, args);
}

export function _for(arr: ts.Expression, indName: ts.Identifier | string, body: BlockLike) : [loop: ts.Statement, index: ts.Expression] {
    const [initializerCreate, initializer] = _var(indName, factory.createNumericLiteral(0));
    return [factory.createForStatement(
        initializerCreate.declarationList,
        factory.createBinaryExpression(initializer, ts.SyntaxKind.LessThanToken, factory.createPropertyAccessExpression(arr, "length")),
        factory.createPostfixIncrement(initializer),
        _stmt(body)
    ), initializer];
}

export function _for_in(arr: ts.Expression, elName: ts.Identifier | string, body: BlockLike) : [loop: ts.Statement, variable: ts.Identifier] {
    const [initializerCreate, initializer] = _var(elName);
    return [factory.createForInStatement(initializerCreate.declarationList, arr, _stmt(body)), initializer];
}

export const UNDEFINED = factory.createIdentifier("undefined");