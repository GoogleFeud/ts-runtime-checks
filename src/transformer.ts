import ts from "typescript";
import * as Block from "./block";
import { FnCallFn, Functions, MarkerCallData, MarkerFn, Markers } from "./markers";
import { TransformerError, getResolvedTypesFromCallSig, getStringFromType, hasBit, resolveAsChain } from "./utils";
import { UNDEFINED, _var } from "./gen/expressionUtils";
import { ResolveTypeData, Validator, genValidator } from "./gen/validators";
import { ValidationResultType, createContext, validateType } from "./gen/nodes";
import { TsRuntimeChecksConfig } from ".";
import { typeToJSONSchema } from "./gen/jsonSchema";
import path from "path";

interface ToBeResolved {
    validators: Validator[],
    optional?: boolean,
    resultType: ValidationResultType,
    top: Validator
}

export class Transformer {
    checker: ts.TypeChecker;
    program: ts.Program;
    config: TsRuntimeChecksConfig;
    ctx: ts.TransformationContext;
    toBeResolved: Map<ts.SignatureDeclaration, ToBeResolved[]>;
    validatedDecls: Set<ts.Declaration>;
    constructor(program: ts.Program, ctx: ts.TransformationContext, config: TsRuntimeChecksConfig) {
        this.checker = program.getTypeChecker();
        this.program = program;
        this.ctx = ctx;
        this.config = config;
        this.toBeResolved = new Map();
        this.validatedDecls = new Set();
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
            Block.runEvents(block);
        }
        return block.nodes;
    } 

    visitor(node: ts.Node, body: Block.Block<ts.Node>) : ts.VisitResult<ts.Node | undefined> {
        if ((ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) && !this.validatedDecls.has(node)) {
            if (!node.body) return node;
            this.validatedDecls.add(node);
            const fnBody = Block.createBlock<ts.Statement>(body);
            for (const param of node.parameters) this.callMarker(param.type, fnBody, { exp: param.name, optional: Boolean(param.questionToken) });
            if (ts.isBlock(node.body)) this.visitEach(node.body.statements, fnBody);
            else {
                const exp = ts.visitNode(node.body, (node) => this.visitor(node, fnBody));
                fnBody.nodes.push(ts.factory.createReturnStatement(exp as ts.Expression));
            }
            if (ts.isFunctionDeclaration(node)) return ts.factory.createFunctionDeclaration(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
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
            const newIdent = this.callMarker(node.type, body, { exp: expOnly })[1];
            if (!ts.isExpressionStatement(node.parent)) return newIdent;
            else return;
        } else if (ts.isBlock(node)) {
            return ts.factory.createBlock(this.visitEach(node.statements, Block.createBlock(body)));
        } else if (ts.isCallExpression(node)) {
            const sigOfCall = this.checker.getResolvedSignature(node);
            // Check for type parameters that need to be resolved
            if (sigOfCall && sigOfCall.declaration) {
                const decl = sigOfCall.declaration as ts.SignatureDeclaration;
                if (!this.validatedDecls.has(decl)) this.visitor(sigOfCall.declaration, body);
                if (this.toBeResolved.has(decl)) {
                    const statements: ts.Statement[] = [], variables: ts.Identifier[] = [], defineVars = [];
                    for (let i=0; i < decl.parameters.length; i++) {
                        const param = decl.parameters[i] as ts.ParameterDeclaration;
                        if (!ts.isIdentifier(param.name)) throw TransformerError(param, "You cannot deconstruct a parameter which contains a Resolve<T> type.");
                        const valueExp = node.arguments[i] || param.initializer || UNDEFINED;
                        if (ts.isIdentifier(valueExp)) variables.push(valueExp);
                        else {
                            const [stmt, identifier] = _var(param.name, node.arguments[i] || param.initializer, ts.NodeFlags.Const);
                            variables.push(identifier);
                            defineVars.push(stmt);
                        }
                    }
                    for (const data of this.toBeResolved.get(decl) as ToBeResolved[]) {
                        const resolved = getResolvedTypesFromCallSig(this.checker, data.validators.map(v => (v.typeData as ResolveTypeData).type), sigOfCall);
                        if (resolved.length) {
                            for (let i=0; i < resolved.length; i++) {
                                const validator = data.validators[i];
                                if (!validator || !resolved[i]) continue;
                                const actualValidator = genValidator(this, resolved[i], "");
                                if (!actualValidator) continue;
                                validator.setChildren(actualValidator.children);
                                validator.typeData = actualValidator.typeData;
                            }
                        }
                        statements.push(
                            ...validateType(data.top, createContext(this, data.resultType), data.optional)
                        );
                    }
                    return ts.factory.createImmediatelyInvokedArrowFunction([
                        ...defineVars,
                        ...statements,
                        ts.factory.createReturnStatement(
                            ts.factory.updateCallExpression(node, node.expression, node.typeArguments, variables)
                        )
                    ]);
                }
            }
            // Check for built-in functions
            if (node.arguments[0]) {
                const callee = node.expression;
                const typeOfFn = this.checker.getTypeAtLocation(callee).getCallSignatures()[0]?.getTypeParameters();
                if (typeOfFn && typeOfFn[0] && typeOfFn[1]) {
                    const fnName = typeOfFn[1].getDefault()?.getProperty("__marker");
                    if (fnName && fnName.valueDeclaration) {
                        const name = this.checker.getTypeOfSymbolAtLocation(fnName, fnName.valueDeclaration);
                        if (name.isStringLiteral()) {
                            const block = Block.createBlock(body);
                            const exp = (Functions[name.value] as FnCallFn)(this, {
                                call: node,
                                block,
                                prevBlock: body,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                type: node.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg))[0] || this.checker.getNullType()
                            });
                            if (exp) return exp;
                            return ts.factory.createImmediatelyInvokedArrowFunction(block.nodes as Array<ts.Statement>);
                        }
                    
                    }
                }
            } 
        } else if (ts.isTypeDeclaration(node) && this.config.jsonSchema) {
            if (this.config.jsonSchema?.types) {
                if (!this.config.jsonSchema.types.includes(node.symbol.name)) return node;
                const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
            }
            else if (this.config.jsonSchema.typePrefix) {
                if (!node.symbol.name.startsWith(this.config.jsonSchema.typePrefix)) return node;
                const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
            }
            else {
                const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
            }
        }
        return ts.visitEachChild(node, (node) => this.visitor(node, body), this.ctx);
    }

    callMarker(node: ts.Node|undefined, block: Block.Block<unknown>, data: Pick<MarkerCallData, "exp"|"optional">) : [ts.Type?, ts.Expression?] {
        if (!node || !ts.isTypeReferenceNode(node)) return [];
        const type = this.resolveActualType(this.checker.getTypeAtLocation(node));
        if (!type || !type.aliasSymbol || !Markers[type.aliasSymbol.name]) return [type];
        return [type, (Markers[type.aliasSymbol.name] as MarkerFn)(this, {
            block,
            parameters: type.aliasTypeArguments as ts.Type[] || node.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg)) || [],
            ...data
        })];
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

    typeValueToNode(t: ts.Type, firstOnly?: true, exprReplacements?: Record<string, ts.Expression>) : ts.Expression;
    typeValueToNode(t: ts.Type, firstOnly?: boolean, exprReplacements?: Record<string, ts.Expression>) : ts.Expression|Array<ts.Expression> {
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
                const strVal = getStringFromType(t, 0);
                return strVal ? this.stringToNode(strVal, exprReplacements) : UNDEFINED;
            }
            else return UNDEFINED;
        }
    }

    stringToNode(str: string, replacements?: Record<string, ts.Expression|((...args: ts.Expression[]) => ts.Node)>) : ts.Expression {
        const result = ts.createSourceFile("expr", str, ts.ScriptTarget.ESNext, false, ts.ScriptKind.JS);
        const firstStmt = result.statements[0];
        if (!firstStmt || !ts.isExpressionStatement(firstStmt)) return UNDEFINED;
        const visitor = (node: ts.Node): ts.Node => {
            if (ts.isIdentifier(node)) {
                if (replacements && replacements[node.text] && typeof replacements[node.text] === "object") return replacements[node.text] as ts.Expression;
                return ts.factory.createIdentifier(node.text);
            }
            else if (replacements && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && replacements[node.expression.text] && typeof replacements[node.expression.text] === "function") return (replacements[node.expression.text] as (...args: ts.Expression[]) => ts.Node)(...node.arguments);
            return ts.visitEachChild(node, visitor, this.ctx);
        };
        return ts.visitNode(firstStmt.expression, visitor) as ts.Expression;
    }

    typeToString(type: ts.Type) : string {
        if (type.isStringLiteral()) return type.value;
        else if (type.isNumberLiteral()) return type.value.toString();
        else {
            const util = this.getUtilityType(type);
            if (util && util.aliasSymbol?.name === "Expr") return getStringFromType(util, 0) || "";
            return "";
        }
    }


}