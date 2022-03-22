import ts from "typescript";
import * as Block from "./block";
import { MacroCallContext, MacroFn, Markers } from "./markers";

export class Transformer {
    checker: ts.TypeChecker;
    ctx: ts.TransformationContext;
    constructor(program: ts.Program, ctx: ts.TransformationContext) {
        this.checker = program.getTypeChecker();
        this.ctx = ctx;
    }

    run(node: ts.SourceFile) : ts.SourceFile {
        if (node.isDeclarationFile) return node;
        const children = this.visitEach(node.statements);
        return ts.factory.updateSourceFile(node, children);
    }

    private visitEach<T extends ts.Node>(nodes: ts.NodeArray<T> | Array<T>, block: Block.Block<T> = Block.createBlock()) : Array<T> {
        for (const statement of nodes) {
            const res = this.visitor(statement, block);
            if (!res) continue;
            if (Array.isArray(res)) block.nodes.push(...res as Array<T>);
            else block.nodes.push(res as T);
        }
        return block.nodes;
    } 

    visitor(node: ts.Node, body: Block.Block<ts.Node>) : ts.VisitResult<ts.Node> {
        if (ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
            if (!node.body) return node;
            const fnBody = Block.createBlock<ts.Statement>(body);
            for (const param of node.parameters) this.callMarkerFromParameterDecl(param, fnBody);
            if (ts.isBlock(node.body)) this.visitEach(node.body.statements, fnBody);
            else {
                const exp = ts.visitNode(node.body, (node) => this.visitor(node, fnBody));
                fnBody.nodes.push(ts.factory.createReturnStatement(exp));
            }
            if (ts.isFunctionDeclaration(node)) return ts.factory.createFunctionDeclaration(node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes));
            else return ts.factory.createFunctionExpression(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes));
        }
        else if (ts.isAsExpression(node)) {
            const sym = this.checker.getSymbolAtLocation(node.expression);
            if (sym) {
                if (Block.isInCache(sym, body)) return node;
                body.cache.add(sym);
            }
            // TBD: Check if the asserted value is a marker, if it is run it...
            return node;
        } else if (ts.isBlock(node)) {
            return ts.factory.createBlock(this.visitEach(node.statements, Block.createBlock(body)));
        }
        else return ts.visitEachChild(node, (node) => this.visitor(node, body), this.ctx);
    }

    callMarkerFromParameterDecl(param: ts.ParameterDeclaration, block: Block.Block<unknown>) : void {
        if (!param.type || !ts.isTypeReferenceNode(param.type)) return;
        const symbol = this.checker.getTypeAtLocation(param.type).aliasSymbol;
        if (!symbol || !Markers[symbol.name] || !symbol.declarations || !symbol.declarations[0]?.getSourceFile().fileName.includes("ts-runtime-checks")) return;
        (Markers[symbol.name] as MacroFn)(this, {
            block,
            parameters: param.type.typeArguments ? param.type.typeArguments.map(t => this.checker.getTypeAtLocation(t)) : [],
            ctx: MacroCallContext.Parameter,
            exp: param.name,
            optional: Boolean(param.questionToken)
        });
    }


}