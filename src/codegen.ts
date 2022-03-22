import ts from "typescript";


export function genIf(condition: ts.Expression, action: ts.Node | Array<ts.Node>, otherwise?: ts.Node | Array<ts.Node>) : ts.IfStatement {
    return ts.factory.createIfStatement(condition, 
        Array.isArray(action) ? ts.factory.createBlock(action.map(a => genStmt(a))) : genStmt(action),
        otherwise && (Array.isArray(otherwise) ? ts.factory.createBlock(otherwise.map(a => genStmt(a))) : genStmt(otherwise))
    );
}

/**
 * Compares the two expressions (strict equality).
 */
export function genCmp(a: ts.Expression, b: ts.Expression, not = true) : ts.Expression {
    return ts.factory.createBinaryExpression(a, not ? ts.SyntaxKind.ExclamationEqualsEqualsToken : ts.SyntaxKind.EqualsEqualsEqualsToken, b);
}

/**
 * Compares the type of the expression with `type`:
 * ```
 * typeof exp === "type"
 * ```
 */
export function genTypeCmp(a: ts.Expression, type: string, not = true) : ts.Expression {
    return ts.factory.createBinaryExpression(ts.factory.createTypeOfExpression(a), 
        not ? ts.SyntaxKind.ExclamationEqualsEqualsToken : ts.SyntaxKind.EqualsEqualsEqualsToken, ts.factory.createStringLiteral(type));
}

export function genOptional(a: ts.Expression, b: ts.Expression, parent?: ts.Expression, name?: ts.StringLiteral) : ts.Expression {
    if (parent && name) return ts.factory.createLogicalAnd(
        ts.factory.createBinaryExpression(name, ts.SyntaxKind.InKeyword, parent),
        b
    );
    else return ts.factory.createLogicalAnd(
        genCmp(a, ts.factory.createIdentifier("undefined"), true),
        b
    );
}

export function genStmt(exp: ts.Node) : ts.Statement {
    if (exp.kind > ts.SyntaxKind.EmptyStatement && exp.kind < ts.SyntaxKind.DebuggerStatement) return exp as ts.Statement;
    return ts.factory.createExpressionStatement(exp as ts.Expression);
}

export function genIdentifier(name: string, initializer?: ts.Expression, flag = ts.NodeFlags.Let) : [ts.VariableStatement, ts.Identifier] {
    const ident = ts.factory.createUniqueName(name);
    return [ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([
        ts.factory.createVariableDeclaration(ident, undefined, undefined, initializer),
    ], flag)), ident];
}