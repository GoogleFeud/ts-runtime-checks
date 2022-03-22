import ts, { factory } from "typescript";


export function genIf(condition: ts.Expression, action: ts.Node | Array<ts.Node>, otherwise?: ts.Node | Array<ts.Node>) : ts.IfStatement {
    return factory.createIfStatement(condition, 
        Array.isArray(action) ? factory.createBlock(action.map(a => genStmt(a))) : genStmt(action),
        otherwise && (Array.isArray(otherwise) ? factory.createBlock(otherwise.map(a => genStmt(a))) : genStmt(otherwise))
    );
}

/**
 * Compares the two expressions (strict equality).
 */
export function genCmp(a: ts.Expression, b: ts.Expression, not = true) : ts.Expression {
    return factory.createBinaryExpression(a, not ? ts.SyntaxKind.ExclamationEqualsEqualsToken : ts.SyntaxKind.EqualsEqualsEqualsToken, b);
}

/**
 * Compares the type of the expression with `type`:
 * ```
 * typeof exp === "type"
 * ```
 */
export function genTypeCmp(a: ts.Expression, type: string, not = true) : ts.Expression {
    return factory.createBinaryExpression(factory.createTypeOfExpression(a), 
        not ? ts.SyntaxKind.ExclamationEqualsEqualsToken : ts.SyntaxKind.EqualsEqualsEqualsToken, factory.createStringLiteral(type));
}

/**
 * Only runs `b` if `a` is not `undefined`. If `parent` and `name` are provided, then it'll use the `in` keyword to check if `name` is in `parent`.
 */
export function genOptional(a: ts.Expression, b: ts.Expression, parent?: ts.Expression, name?: string) : ts.Expression {
    if (parent && name) return factory.createLogicalAnd(
        factory.createBinaryExpression(factory.createStringLiteral(name), ts.SyntaxKind.InKeyword, parent),
        b
    );
    else return factory.createLogicalAnd(
        genCmp(a, factory.createIdentifier("undefined"), true),
        b
    );
}

export function genThrow(val: ts.Expression) : ts.Statement {
    return factory.createThrowStatement(val);
}

export function genNew(inst: string, parameters: string|Array<ts.Expression>) : ts.Expression {
    return factory.createNewExpression(
        factory.createIdentifier(inst),
        undefined,
        typeof parameters === "string" ? [factory.createStringLiteral(parameters)] : parameters
    );
}

export function genInstanceof(exp: ts.Expression, inst: string | ts.Identifier) : ts.Expression {
    return factory.createBinaryExpression(exp, ts.SyntaxKind.InstanceOfKeyword, typeof inst === "string" ? factory.createIdentifier(inst) : inst);
}

export function genFnCall(call: ts.Expression, args: Array<string>, body: ts.Expression | Array<ts.Statement>) : ts.Expression {
    return factory.createCallExpression(call, undefined, [
        factory.createArrowFunction(undefined, undefined, 
            args.map(arg => factory.createParameterDeclaration(undefined, undefined, undefined, arg, undefined, undefined, undefined)),
            undefined, 
            undefined,
            Array.isArray(body) ? factory.createBlock(body) : body
        )
    ]);
}

export function genPropCall(root: ts.Expression, prop: string, args: Array<string>, body: ts.Expression | Array<ts.Statement>) : ts.Expression {
    return genFnCall(factory.createPropertyAccessExpression(
        root,
        factory.createIdentifier(prop)
    ), args, body);
}

export function genForLoop(arr: ts.Expression, indName: ts.Identifier | string, body: ts.Expression | Array<ts.Statement>) : [loop: ts.Statement, index: ts.Expression] {
    const [initializerCreate, initializer] = genIdentifier(indName, factory.createNumericLiteral(0));
    return [factory.createForStatement(
        initializerCreate.declarationList,
        factory.createBinaryExpression(initializer, ts.SyntaxKind.LessThanToken, factory.createPropertyAccessExpression(arr, "length")),
        factory.createPostfixIncrement(initializer),
        Array.isArray(body) ? factory.createBlock(body) : factory.createExpressionStatement(body)
    ), initializer];
}

export function genNot(exp: ts.Expression) : ts.Expression {
    return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
}

export function genStmt(exp: ts.Node) : ts.Statement {
    if (exp.kind > ts.SyntaxKind.EmptyStatement && exp.kind < ts.SyntaxKind.DebuggerStatement) return exp as ts.Statement;
    return factory.createExpressionStatement(exp as ts.Expression);
}

export function genIdentifier(name: ts.Identifier | string, initializer?: ts.Expression, flag = ts.NodeFlags.Let) : [ts.VariableStatement, ts.Identifier] {
    const ident = typeof name === "string" ? factory.createUniqueName(name) : name;
    return [factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
        factory.createVariableDeclaration(ident, undefined, undefined, initializer),
    ], flag)), ident];
}

export const UNDEFINED = factory.createIdentifier("undefined");