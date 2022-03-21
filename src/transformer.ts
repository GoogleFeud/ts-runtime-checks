import ts from "typescript";

export class Transformer {
    checker: ts.TypeChecker;
    constructor(program: ts.Program) {
        this.checker = program.getTypeChecker();
    }

    run(node: ts.SourceFile) : ts.SourceFile {
        //if (node.isDeclarationFile) return node;
        return node;
    }

    visitor(node: ts.Node, body: Array<ts.Statement> = []) : ts.VisitResult<ts.Node> {

        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
            if (!node.body) return node;
            const fnBody: Array<ts.Statement> = [];
            // TBD: Check if any of the markers are in the function parameters, and if so only do the following AND run the markers
            if (ts.isBlock(node.body)) {
                for (const exp of node.body.statements) {
                    this.visitor(exp, fnBody);
                }
            } else {
                this.visitor(node.body, fnBody);
                if (fnBody.length) {
                    const last = fnBody[fnBody.length - 1] as ts.Statement; 
                    if (ts.isExpressionStatement(last)) fnBody[fnBody.length - 1] = ts.factory.createReturnStatement(last.expression);
                }
            }
            return ts.factory.createFunctionDeclaration(node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody));
        } 
        else if (ts.isAsExpression(node)) {
            // TBD: Check if the asserted value is a marker, if it is run it...
            return node;
        } else 
            return ts.forEachChild(node, (node) => this.visitor(node, body));
    }

}