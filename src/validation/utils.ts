/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts, { factory } from "typescript";


export function genIf(condition: ts.Expression, action: ts.Node | Array<ts.Node>, otherwise?: ts.Node | Array<ts.Node>) : ts.IfStatement {
    return factory.createIfStatement(condition, 
        genStmt(action),
        otherwise && genStmt(otherwise)
    );
}

function _genIfElseChain(ind: number, check: Array<[ts.Expression, Array<ts.Node>]>, last?: ts.Statement) : ts.IfStatement | undefined {
    if (ind >= check.length) return;
    return factory.createIfStatement(check[ind]![0], genStmt(check[ind]![1]), _genIfElseChain(ind + 1, check, last) || last);
}

export function genIfElseChain(checks: Array<[ts.Expression, Array<ts.Node>]>, last?: ts.Node | Array<ts.Node>) : ts.IfStatement {
    const chain = _genIfElseChain(0, checks, last ? genStmt(last) : undefined)!;
    return chain;
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

export function genBinaryChain(syntax: ts.BinaryOperator, exps: Array<ts.Expression>) : ts.Expression {
    if (exps.length === 1) return exps[0]!;
    let start = factory.createBinaryExpression(exps[0] as ts.Expression, syntax, exps[1] as ts.Expression);
    for (let i=2; i < exps.length; i++) {
        start = factory.createBinaryExpression(start, syntax, exps[i] as ts.Expression);
    }
    return start;
}

export function genLogicalOR(...exps: Array<ts.Expression>) : ts.Expression {
    return genBinaryChain(ts.SyntaxKind.BarBarToken, exps);
}

export function genLogicalAND(...exps: Array<ts.Expression>) : ts.Expression {
    return genBinaryChain(ts.SyntaxKind.AmpersandAmpersandToken, exps);
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

export function genPropAccess(exp: ts.Expression, thing: string) : ts.Expression {
    return factory.createPropertyAccessExpression(exp, thing);
}

export function genForLoop(arr: ts.Expression, indName: ts.Identifier | string, body: ts.Expression | Array<ts.Statement>) : [loop: ts.Statement, index: ts.Expression] {
    const [initializerCreate, initializer] = genIdentifier(indName, factory.createNumericLiteral(0));
    return [factory.createForStatement(
        initializerCreate.declarationList,
        factory.createBinaryExpression(initializer, ts.SyntaxKind.LessThanToken, factory.createPropertyAccessExpression(arr, "length")),
        factory.createPostfixIncrement(initializer),
        genStmt(body)
    ), initializer];
}

export function genForInLoop(arr: ts.Expression, elName: ts.Identifier | string, body: ts.Expression | Array<ts.Statement>) : [loop: ts.Statement, variable: ts.Identifier] {
    const [initializerCreate, initializer] = genIdentifier(elName);
    return [factory.createForInStatement(initializerCreate.declarationList, arr, genStmt(body)), initializer];
} 

export function genNot(exp: ts.Expression) : ts.Expression {
    return factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, exp);
}

export function genAdd(a: ts.Expression, b: ts.Expression) {
    return factory.createAdd(a, b);
}

export function genStr(str: string) {
    return factory.createStringLiteral(str);
}

export function genNum(num: number) {
    return factory.createNumericLiteral(num);
}

export function genStmt(exp: ts.Node | Array<ts.Node>) : ts.Statement {
    if (Array.isArray(exp)) return factory.createBlock(exp.map(genStmt), true);
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