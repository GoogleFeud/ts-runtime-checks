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

}