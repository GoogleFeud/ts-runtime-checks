import ts from "typescript";
import * as Block from "./block";
import { MacroCallContext, MacroFn, Markers } from "./markers";
import { hasBit, resolveAsChain } from "./utils";
import { UNDEFINED } from "./validation/utils";

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
            if (ts.isFunctionDeclaration(node)) return ts.factory.createFunctionDeclaration(node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
            else if (ts.isArrowFunction(node)) return ts.factory.createArrowFunction(node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, ts.factory.createBlock(fnBody.nodes, true));
            else return ts.factory.createFunctionExpression(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
        }
        else if (ts.isAsExpression(node)) {
            let expOnly = resolveAsChain(node);
            const sym = this.checker.getSymbolAtLocation(expOnly);
            if (sym) {
                if (Block.isInCache(sym, body)) return node;
                body.cache.add(sym);
            }
            expOnly = ts.visitEachChild(expOnly, (node) => this.visitor(node, body), this.ctx);
            const newIdent = this.callMarkerFromAsExpression(node, expOnly, body);
            if (!ts.isExpressionStatement(node.parent)) return newIdent;
            else return;
        } else if (ts.isBlock(node)) {
            return ts.factory.createBlock(this.visitEach(node.statements, Block.createBlock(body)));
        }
        else return ts.visitEachChild(node, (node) => this.visitor(node, body), this.ctx);
    }

    callMarkerFromParameterDecl(param: ts.ParameterDeclaration, block: Block.Block<unknown>) : void {
        if (!param.type || !ts.isTypeReferenceNode(param.type)) return;
        const type = this.resolveActualType(this.checker.getTypeAtLocation(param.type));
        if (!type || !type.aliasSymbol || !Markers[type.aliasSymbol.name]) return;
        (Markers[type.aliasSymbol.name] as MacroFn)(this, {
            block,
            parameters: type.aliasTypeArguments as Array<ts.Type> || param.type.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg)) || [],
            ctx: MacroCallContext.Parameter,
            exp: param.name,
            optional: Boolean(param.questionToken)
        });
    }

    callMarkerFromAsExpression(exp: ts.AsExpression, expOnly: ts.Expression, block: Block.Block<unknown>) : ts.Expression {
        if (!ts.isTypeReferenceNode(exp.type)) return exp;
        const type = this.resolveActualType(this.checker.getTypeAtLocation(exp.type));
        console.log(type && this.checker.typeToString(type), type?.aliasSymbol?.name);
        if (!type || !type.aliasSymbol || !Markers[type.aliasSymbol.name]) return exp;
        return (Markers[type.aliasSymbol.name] as MacroFn)(this, {
            block,
            parameters: type.aliasTypeArguments as Array<ts.Type> || exp.type.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg)) || [],
            ctx: MacroCallContext.As,
            exp: expOnly
        }) || exp;
    }

    resolveActualType(t: ts.Type) : ts.Type | undefined {
        const prop = t.getProperty("__marker");
        if (!prop || !prop.valueDeclaration) return;
        return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration));
    }
    
    getUtilityType(type: ts.Type) : ts.Type|undefined {
        const prop = type.getProperty("__utility");
        if (!prop || !prop.valueDeclaration) return;
        return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration));
    }

    getStringFromType(t: ts.Type, argNum: number) : string|undefined {
        const arg = t.aliasTypeArguments?.[argNum];
        if (arg && arg.isStringLiteral()) return arg.value;
        return undefined;
    }
    
    getNodeFromType(t: ts.Type, argNum: number) : ts.Expression|undefined {
        const arg = t.aliasTypeArguments?.[argNum];
        if (!arg) return;
        const val = this.typeValueToNode(arg, true);
        if (ts.isIdentifier(val) && val.text === "undefined") return undefined;
        return val;
    }

    typeValueToNode(t: ts.Type, firstOnly?: true) : ts.Expression;
    typeValueToNode(t: ts.Type, firstOnly?: boolean) : ts.Expression|Array<ts.Expression> {
        if (t.isStringLiteral()) return ts.factory.createStringLiteral(t.value);
        else if (t.isNumberLiteral()) return ts.factory.createNumericLiteral(t.value);
        else if (hasBit(t, ts.TypeFlags.BigIntLiteral)) {
            const { value } = (t as ts.BigIntLiteralType);
            return ts.factory.createBigIntLiteral(value);
        }
        else if (t.isUnion()) {
            const res = t.types.map(t => this.typeValueToNode(t, true));
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (firstOnly) return res[0]!;
            else return res;
        }
        //@ts-expect-error Private API
        else if (t.intrinsicName === "false") return ts.factory.createFalse();
        //@ts-expect-error Private API
        else if (t.intrinsicName === "true") return ts.factory.createTrue();
        //@ts-expect-error Private API
        else if (t.intrinsicName === "null") return ts.factory.createNull();
        else {
            const utility = this.getUtilityType(t);
            if (utility && utility.aliasSymbol?.name === "Expr") {
                const strVal = this.getStringFromType(t, 0);
                return strVal ? this.stringToNode(strVal) : UNDEFINED;
            }
            else return UNDEFINED;
        }
    }

    stringToNode(str: string, replacements?: Record<string, ts.Expression>) : ts.Expression {
        const result = ts.createSourceFile("expr", str, ts.ScriptTarget.ESNext, false, ts.ScriptKind.JS);
        const firstStmt = result.statements[0];
        if (!firstStmt || !ts.isExpressionStatement(firstStmt)) return UNDEFINED;
        const visitor = (node: ts.Node): ts.Node => {
            if (ts.isIdentifier(node)) {
                if (replacements && replacements[node.text]) return replacements[node.text] as ts.Expression;
                return ts.factory.createIdentifier(node.text);
            }
            return ts.visitEachChild(node, visitor, this.ctx);
        };
        return ts.visitNode(firstStmt.expression, visitor);
    }


}