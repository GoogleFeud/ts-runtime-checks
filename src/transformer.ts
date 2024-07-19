import ts from "typescript";
import * as Block from "./block";
import {FnCallFn, Functions, MarkerCallData, MarkerFn, Markers} from "./markers";
import {TransformerError, cloneNodeWithoutOriginal, getResolvedTypesFromCallSig, hasBit, importSymbol, resolveAsChain} from "./utils";
import {UNDEFINED, _var} from "./gen/expressionUtils";
import {CodeReference, ResolveTypeData, Validator, genValidator} from "./gen/validators";
import {ValidationResultType, createContext, fullValidate} from "./gen/nodes";
import {TsRuntimeChecksConfig} from ".";
import {typeToJSONSchema} from "./gen/jsonSchema";

interface ToBeResolved {
    validators: Validator[];
    optional?: boolean;
    resultType: ValidationResultType;
    top: Validator;
}

export enum CodeReferenceKind {
    String,
    Function
}

export type CodeReferenceExpand = {kind: CodeReferenceKind; expression: ts.Expression};

export type CodeReferenceReplacement = Record<string, ts.Expression | ((...args: ts.Expression[]) => ts.Node)>;

export class Transformer {
    checker: ts.TypeChecker;
    program: ts.Program;
    config: TsRuntimeChecksConfig;
    ctx: ts.TransformationContext;
    toBeResolved: Map<ts.SignatureDeclaration, ToBeResolved[]>;
    validatedDecls: Map<ts.Declaration, ts.FunctionLikeDeclaration>;
    symbolsToImport: {
        identifierMap: Map<ts.Symbol, ts.Identifier>;
        importStatements: ts.ImportDeclaration[];
    };
    constructor(program: ts.Program, ctx: ts.TransformationContext, config: TsRuntimeChecksConfig) {
        this.checker = program.getTypeChecker();
        this.program = program;
        this.ctx = ctx;
        this.config = config;
        this.toBeResolved = new Map();
        this.validatedDecls = new Map();
        this.symbolsToImport = {
            identifierMap: new Map(),
            importStatements: []
        };
    }

    run(node: ts.SourceFile): ts.SourceFile {
        if (node.isDeclarationFile) return node;
        const children = this.visitEach(node.statements);
        const allChildren = [...this.symbolsToImport.importStatements, ...children];
        this.symbolsToImport = {identifierMap: new Map(), importStatements: []};
        return ts.factory.updateSourceFile(node, allChildren);
    }

    importSymbol(sym: ts.Symbol, node: ts.Node): ts.Identifier | undefined {
        if (this.symbolsToImport.identifierMap.has(sym)) return this.symbolsToImport.identifierMap.get(sym);
        const res = importSymbol(node.getSourceFile(), sym);
        if (!res) return ts.factory.createIdentifier(sym.escapedName as string);
        this.symbolsToImport.importStatements.push(res[0]);
        this.symbolsToImport.identifierMap.set(sym, res[1]);
        return res[1];
    }

    private visitEach<T extends ts.Node>(nodes: ts.NodeArray<T> | Array<T>, block: Block.Block<T> = Block.createBlock()): Array<T> {
        for (const statement of nodes) {
            const res = this.visitor(statement, block);
            if (!res) continue;
            if (Array.isArray(res)) block.nodes.push(...(res as Array<T>));
            else block.nodes.push(res as T);
            Block.runEvents(block);
        }
        return block.nodes;
    }

    visitor(node: ts.Node, body: Block.Block<ts.Node>): ts.VisitResult<ts.Node | undefined> {
        if (ts.isFunctionLikeDeclaration(node)) {
            if (this.validatedDecls.has(node)) return this.validatedDecls.get(node);
            this.validatedDecls.set(node, node);
            if (!node.body) return node;
            const fnBody = Block.createBlock<ts.Statement>(body);
            for (const param of node.parameters) this.callMarker(param.type, fnBody, {exp: param.name as ts.Expression, optional: Boolean(param.questionToken)});
            if (ts.isBlock(node.body)) this.visitEach(node.body.statements, fnBody);
            else {
                const exp = ts.visitNode(node.body, node => this.visitor(node, fnBody));
                fnBody.nodes.push(ts.factory.createReturnStatement(exp as ts.Expression));
            }
            let stmt: ts.FunctionLikeDeclaration;
            if (ts.isFunctionDeclaration(node))
                stmt = ts.factory.createFunctionDeclaration(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
            else if (ts.isArrowFunction(node))
                stmt = ts.factory.createArrowFunction(node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, ts.factory.createBlock(fnBody.nodes, true));
            else if (ts.isMethodDeclaration(node))
                stmt = ts.factory.createMethodDeclaration(
                    node.modifiers,
                    node.asteriskToken,
                    node.name,
                    node.questionToken,
                    node.typeParameters,
                    node.parameters,
                    node.type,
                    ts.factory.createBlock(fnBody.nodes, true)
                );
            else if (ts.isGetAccessorDeclaration(node))
                stmt = ts.factory.createGetAccessorDeclaration(node.modifiers, node.name, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
            else if (ts.isSetAccessorDeclaration(node)) stmt = ts.factory.createSetAccessorDeclaration(node.modifiers, node.name, node.parameters, ts.factory.createBlock(fnBody.nodes, true));
            else if (ts.isConstructorDeclaration(node)) stmt = ts.factory.createConstructorDeclaration(node.modifiers, node.parameters, ts.factory.createBlock(fnBody.nodes, true));
            else stmt = ts.factory.createFunctionExpression(node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, ts.factory.createBlock(fnBody.nodes, true));
            this.validatedDecls.set(node, stmt);
            return stmt;
        } else if (ts.isAsExpression(node)) {
            let expOnly = resolveAsChain(node);
            const sym = this.checker.getSymbolAtLocation(expOnly);
            if (sym) {
                if (Block.isInCache(sym, body)) return node;
                body.cache.add(sym);
            }
            expOnly = ts.visitEachChild(expOnly, node => this.visitor(node, body), this.ctx);
            const newIdent = this.callMarker(node.type, body, {exp: expOnly});
            if (!newIdent) return node;
            if (!ts.isExpressionStatement(node.parent)) return newIdent[1];
            else return;
        } else if (ts.isBlock(node)) {
            return ts.factory.createBlock(this.visitEach(node.statements, Block.createBlock(body)));
        } else if (ts.isCallExpression(node)) {
            const sigOfCall = this.checker.getResolvedSignature(node);
            // Check for type parameters that need to be resolved
            if (sigOfCall && sigOfCall.declaration && ts.isFunctionLikeDeclaration(sigOfCall.declaration)) {
                const decl = sigOfCall.declaration;
                if (!this.validatedDecls.has(decl)) this.validatedDecls.set(decl, ts.visitNode(decl, node => this.visitor(node, body)) as ts.FunctionLikeDeclaration);
                if (this.toBeResolved.has(decl)) {
                    const statements: ts.Statement[] = [],
                        variables: ts.Identifier[] = [],
                        defineVars = [];
                    for (let i = 0; i < decl.parameters.length; i++) {
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
                    resolveTypeLoop: for (const data of this.toBeResolved.get(decl) as ToBeResolved[]) {
                        const ctx = createContext(this, data.resultType, node);
                        const resolved = getResolvedTypesFromCallSig(
                            this.checker,
                            data.validators.map(v => (v.typeData as ResolveTypeData).type),
                            sigOfCall
                        );
                        if (resolved.length) {
                            for (let i = 0; i < resolved.length; i++) {
                                const validator = data.validators[i];
                                if (!validator || !resolved[i]) continue resolveTypeLoop;
                                const actualValidator = genValidator(this, resolved[i], validator.name, validator.customExp, validator.parent);
                                if (!actualValidator) continue resolveTypeLoop;
                                ctx.resolvedTypeArguments.set(validator._original, actualValidator);
                            }
                        }
                        statements.push(...fullValidate(data.top, ctx, data.optional));
                    }
                    if (!statements.length) return node;
                    return ts.factory.createImmediatelyInvokedArrowFunction([
                        ...defineVars,
                        ...statements,
                        ts.factory.createReturnStatement(ts.factory.updateCallExpression(node, node.expression, node.typeArguments, variables))
                    ]);
                }
            }
            // Check for built-in functions
            if (node.arguments[0]) {
                const callee = node.expression;
                const typeOfFn = this.checker.getTypeAtLocation(callee).getCallSignatures()[0]?.getTypeParameters();
                if (typeOfFn) {
                    const specialTypeParam = typeOfFn.find(t => t.default && t.default.getProperty("__$marker")) as ts.Type & {default: ts.Type};
                    if (specialTypeParam) {
                        const nameType = specialTypeParam.default.getProperty("__$marker") as ts.Symbol;
                        if (nameType.valueDeclaration) {
                            const name = this.checker.getTypeOfSymbolAtLocation(nameType, nameType.valueDeclaration);
                            if (name && name.isStringLiteral()) {
                                const block = Block.createBlock(body);
                                const exp = (Functions[name.value] as FnCallFn)(this, {
                                    call: node,
                                    block,
                                    prevBlock: body,
                                    parameters: node.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg)) || []
                                });
                                if (exp) return exp;
                                return ts.factory.createImmediatelyInvokedArrowFunction(block.nodes as Array<ts.Statement>);
                            }
                        }
                    }
                }
            }
        } else if (ts.isTypeDeclaration(node) && this.config.jsonSchema) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const path = require("path");
            if (this.config.jsonSchema?.types) {
                if (this.config.jsonSchema.types.includes(node.symbol.name)) {
                    const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                    if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
                }
            } else if (this.config.jsonSchema.typePrefix) {
                if (node.symbol.name.startsWith(this.config.jsonSchema.typePrefix)) {
                    const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                    if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
                }
            } else {
                const jsonSchemaVal = typeToJSONSchema(this, this.checker.getTypeAtLocation(node));
                if (jsonSchemaVal) this.program.writeFile(path.join(this.config.jsonSchema.dist, `${node.symbol.name}.json`), JSON.stringify(jsonSchemaVal), false);
            }
        }
        return ts.visitEachChild(node, node => this.visitor(node, body), this.ctx);
    }

    callMarker(node: ts.Node | undefined, block: Block.Block<unknown>, data: Pick<MarkerCallData, "exp" | "optional">): [ts.Type, ts.Expression?] | undefined {
        if (!node || !ts.isTypeReferenceNode(node)) return;
        const type = this.checker.getTypeAtLocation(node);
        if (!type) return;
        const markerName = this.getPropType(type, "marker");
        if (!markerName || !markerName.isStringLiteral()) return;
        const markerParams = this.getPropType(type, "marker_params");
        if (!markerParams || !this.checker.isTupleType(markerParams)) return;
        return [
            type,
            (Markers[markerName.value] as MarkerFn)(this, {
                block,
                parameters: (this.checker.getTypeArguments(markerParams as ts.TypeReference) as ts.Type[]) || node.typeArguments?.map(arg => this.checker.getTypeAtLocation(arg)) || [],
                ...data
            })
        ];
    }

    getPropType(type: ts.Type, prop: string): ts.Type | undefined {
        const propSym = type.getProperty(`__$${prop}`);
        if (!propSym || !propSym.valueDeclaration) return;
        return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(propSym, propSym.valueDeclaration));
    }

    resolveActualType(t: ts.Type): ts.Type | undefined {
        const prop = t.getProperty("__$marker");
        if (!prop || !prop.valueDeclaration) return;
        return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration));
    }

    typeValueToNode(t: ts.Type, firstOnly?: true, exprReplacements?: Record<string, ts.Expression>): ts.Expression;
    typeValueToNode(t: ts.Type, firstOnly?: boolean, exprReplacements?: Record<string, ts.Expression>): ts.Expression | Array<ts.Expression> {
        if (t.isStringLiteral()) return ts.factory.createStringLiteral(t.value);
        else if (t.isNumberLiteral()) return ts.factory.createNumericLiteral(t.value);
        else if (hasBit(t, ts.TypeFlags.BigIntLiteral)) {
            const {value} = t as ts.BigIntLiteralType;
            return ts.factory.createBigIntLiteral(value);
        } else if (t.isUnion()) {
            const res = t.types.map(t => this.typeValueToNode(t, true));
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
            const utility = this.getPropType(t, "name");
            if (utility && utility.isStringLiteral() && utility.value === "Expr") {
                const strType = this.getPropType(t, "type");
                return strType && strType.isStringLiteral() ? this.stringToNode(strType.value, exprReplacements) : UNDEFINED;
            } else return UNDEFINED;
        }
    }

    stringToNode(str: string, replacements?: Record<string, ts.Expression | ((...args: ts.Expression[]) => ts.Node)>): ts.Expression {
        const result = ts.createSourceFile("expr", str, ts.ScriptTarget.ESNext, false, ts.ScriptKind.JS);
        const firstStmt = result.statements[0];
        if (!firstStmt || !ts.isExpressionStatement(firstStmt)) return UNDEFINED;
        //console.dir(firstStmt, { depth: 3});
        const visitor = (node: ts.Node): ts.Node => {
            if (ts.isIdentifier(node)) {
                if (replacements && replacements[node.text] && typeof replacements[node.text] === "object") return ts.factory.cloneNode(replacements[node.text] as ts.Expression);
                return ts.factory.createIdentifier(node.text);
            }
            else if (replacements && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && replacements[node.expression.text] && typeof replacements[node.expression.text] === "function") {   
                return (replacements[node.expression.text] as (...args: ts.Expression[]) => ts.Node)(...node.arguments);
            }
            return ts.visitEachChild(cloneNodeWithoutOriginal(node), visitor, this.ctx);
        };
        return ts.visitNode(firstStmt.expression, visitor) as ts.Expression;
    }

    typeToString(type: ts.Type): string {
        if (type.isStringLiteral()) return type.value;
        else if (type.isNumberLiteral()) return type.value.toString();
        else {
            const utility = this.getPropType(type, "name");
            if (utility && utility.isStringLiteral() && utility.value === "Expr") {
                const strType = this.getPropType(type, "type");
                if (strType && utility.isStringLiteral()) return utility.value;
                else return "";
            } else return "";
        }
    }

    expandCodeRef(codes: CodeReference[], origin: ts.Node, getReplacements: () => CodeReferenceReplacement): CodeReferenceExpand[] {
        const refs: CodeReferenceExpand[] = [];

        for (const code of codes) {
            if (typeof code === "string") {
                refs.push({kind: CodeReferenceKind.String, expression: this.stringToNode(code, getReplacements())});
            } else {
                const importedSym = this.importSymbol(code, origin);
                if (!importedSym) continue;
                refs.push({kind: CodeReferenceKind.Function, expression: importedSym});
            }
        }
        return refs;
    }
}
