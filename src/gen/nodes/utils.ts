
import ts, { factory } from "typescript";

export type BlockLike = ts.Block | Array<ts.Statement>;

export function _block(stmts: BlockLike) : ts.Block {
    if (Array.isArray(stmts)) return factory.createBlock(stmts);
    else return stmts;
}

export function _if(condition: ts.Expression, ifTrue: BlockLike, ifFalse: BlockLike) : ts.IfStatement {
    return factory.createIfStatement(condition, _block(ifTrue), _block(ifFalse));
}

export function _ident(name: ts.Identifier | string, initializer?: ts.Expression, flag = ts.NodeFlags.Let) : [ts.VariableStatement, ts.Identifier] {
    const ident = typeof name === "string" ? factory.createUniqueName(name) : name;
    return [factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
        factory.createVariableDeclaration(ident, undefined, undefined, initializer),
    ], flag)), ident];
}

export function _bin(left: ts.Expression, right: ts.Expression, op: ts.BinaryOperator) : ts.Expression {
    return ts.factory.createBinaryExpression(left, op, right);
}

export function _typeof_cmp(left: ts.Expression, type: string, op: ts.BinaryOperator = ts.SyntaxKind.EqualsEqualsEqualsToken) {
    return factory.createBinaryExpression(factory.createTypeOfExpression(left), op, factory.createStringLiteral(type));
}

export function _bin_chain(exps: Array<ts.Expression>, op: ts.BinaryOperator) : ts.Expression {
    if (exps.length === 1) return exps[0] as ts.Expression;
    let start = factory.createBinaryExpression(exps[0] as ts.Expression, op, exps[1] as ts.Expression);
    for (let i=2; i < exps.length; i++) {
        start = factory.createBinaryExpression(start, op, exps[i] as ts.Expression);
    }
    return start;
}

export function _and(...exps: Array<ts.Expression>) : ts.Expression {
    return _bin_chain(exps, ts.SyntaxKind.AmpersandAmpersandToken);
}

export function _or(...exps: Array<ts.Expression>) : ts.Expression {
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
        }
    }
    else if (ts.isPrefixUnaryExpression(exp) && exp.operator === ts.SyntaxKind.ExclamationToken) return exp.operand;
    return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
}


export function _access(exp: ts.Expression, key: string | number | ts.Expression) : ts.Expression {
    if (typeof key === "string") return ts.factory.createPropertyAccessExpression(exp, key);
    else return ts.factory.createElementAccessExpression(exp, key);
}