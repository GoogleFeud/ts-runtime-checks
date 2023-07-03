import ts from "typescript";
import { NumberTypes, ObjectTypeDataExactOptions, TypeDataKinds, Validator } from "../validators";
import { _and, _bin, _bin_chain, _for, _if, _new, _not, _num, _or, _str, _throw, _typeof_cmp, BlockLike, UNDEFINED, concat, joinElements, Stringifyable, _if_nest, _instanceof, _access, _call, _for_in, _ident, _bool, _obj_check, _obj, _var, _obj_binding_decl, _arr_binding_decl, _concise, _ternary } from "../expressionUtils";
import { Transformer } from "../../transformer";

export interface ValidationResultType {
    throw?: string,
    return?: ts.Expression,
    returnErr?: boolean,
    custom?: (msg: ts.Expression) => ts.Statement,
    rawErrors?: boolean,
    none?: boolean
}

export interface NodeGenContext {
    transformer: Transformer,
    resultType: ValidationResultType,
    recursiveFns: ts.FunctionDeclaration[],
    recursiveFnNames: Map<ts.Type, ts.Identifier>
}

export function createContext(transformer: Transformer, resultType: ValidationResultType) : NodeGenContext {
    return {
        transformer,
        resultType,
        recursiveFns: [],
        recursiveFnNames: new Map()
    };
}

export type GenResultError = [validator: Validator, message: ts.Expression[]];

export interface GenResult {
    condition: ts.Expression,
    error?: GenResultError,
    ifTrue?: BlockLike,
    ifFalse?: BlockLike,
    after?: ts.Statement[],
    before?: ts.Statement[],
    minimzed?: boolean
}

export function joinResultStmts(result: GenResult) : ts.Statement[] {
    return [...(result.before || []), ...(result.after || [])];
}

export function error(ctx: NodeGenContext, error?: GenResultError, isFull = false) : ts.Statement {
    if (ctx.resultType.none) return ts.factory.createReturnStatement();
    if (ctx.resultType.return) return ts.factory.createReturnStatement(ctx.resultType.return);
    if (!error) return ts.factory.createReturnStatement();
    const finalMsg = ctx.resultType.rawErrors ? _obj({
        value: error[0].expression(),
        valueName: _bin_chain(joinElements(error[0].path()), ts.SyntaxKind.PlusToken),
        expectedType: _obj(error[0].typeData as unknown as Record<string, ts.Expression>)
    }) : _bin_chain(isFull ? error[1] : joinElements(["Expected ", ...error[0].path(), " ", ...error[1]]), ts.SyntaxKind.PlusToken);
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(finalMsg);
    else if (ctx.resultType.throw) return _throw(_new(ctx.resultType.throw, [finalMsg]));
    else if (ctx.resultType.custom) return ctx.resultType.custom(finalMsg);
    else return _throw(_new("Error", [finalMsg]));
}

export function genNode(validator: Validator, ctx: NodeGenContext) : GenResult {
    if (validator.isRecursiveOrigin) {
        validator.isRecursiveOrigin = false;
        const originalCustomExp = validator.customExp;
        const name = typeof validator.name === "string" ? _ident(validator.name) : _ident("_recursive");
        const paramName = _ident("param");
        validator.customExp = paramName;
        ctx.recursiveFnNames.set(validator._original, name);
        const statements = validateType(validator, {
            ...ctx,
            resultType: { return: _bool(false) }
        });
        ctx.recursiveFns.push(ts.factory.createFunctionDeclaration(undefined, undefined, name, undefined,
            [ts.factory.createParameterDeclaration(undefined, undefined, paramName, undefined, undefined, undefined)],
            undefined,
            ts.factory.createBlock(statements[0] && ts.isIfStatement(statements[0]) && !statements[0].elseStatement ? [ts.factory.createReturnStatement(_not(statements[0].expression))] : [...statements, ts.factory.createReturnStatement(_bool(true))])
        ));
        validator.customExp = originalCustomExp;
        validator.isRecursiveOrigin = true;
        return {
            condition: _not(_call(name, [validator.expression()])),
            error: [validator, [_str(`to be ${ctx.transformer.checker.typeToString(validator._original)}`)]]
        };
    }
    switch (validator.typeData.kind) {
    case TypeDataKinds.Number: {
        if (validator.typeData.literal !== undefined) return {
            condition: _bin(validator.expression(), _num(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, concat`to be equal to ${validator.typeData.literal.toString()}`]
        };
        const errorMessages = [], checks: ts.Expression[] = [_typeof_cmp(validator.expression(), "number", ts.SyntaxKind.ExclamationEqualsEqualsToken)];
        if (validator.typeData.type === NumberTypes.Integer) {
            checks.push(_bin(_bin(validator.expression(), _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.ExclamationEqualsEqualsToken));
            errorMessages.push("to be an integer");
        }
        else if (validator.typeData.type === NumberTypes.Float) {
            checks.push(_bin(_bin(validator.expression(), _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.EqualsEqualsEqualsToken));
            errorMessages.push("to be a float");
        } else {
            errorMessages.push("to be a number");
        }

        if (validator.typeData.min) {
            checks.push(_bin(validator.expression(), validator.typeData.min, ts.SyntaxKind.LessThanToken));
            errorMessages.push(...concat`to be greater than ${validator.typeData.min}`);
        }

        if (validator.typeData.max) {
            checks.push(_bin(validator.expression(), validator.typeData.max, ts.SyntaxKind.GreaterThanToken));
            errorMessages.push(...concat`to be less than ${validator.typeData.max}`);
        }

        return {
            condition: _or(checks),
            error: [validator, joinElements(errorMessages, ", ")]
        };
    }
    case TypeDataKinds.String: {
        if (validator.typeData.literal !== undefined) return {
            condition: _bin(validator.expression(), _str(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, concat`to be equal to "${validator.typeData.literal}"`]
        };

        const errorMessages: Stringifyable[] = ["to be a string"], checks: ts.Expression[] = [_typeof_cmp(validator.expression(), "string", ts.SyntaxKind.ExclamationEqualsEqualsToken)];

        if (validator.typeData.length) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.length, ts.SyntaxKind.ExclamationEqualsEqualsToken));
            errorMessages.push(...concat`to have a length of ${validator.typeData.length}`);
        }

        if (validator.typeData.matches) {
            let regexp;
            if (ts.isStringLiteral(validator.typeData.matches)) {
                if (validator.typeData.matches.text !== "") regexp = ts.factory.createRegularExpressionLiteral(validator.typeData.matches.text);
            } else regexp = validator.typeData.matches;
            if (regexp) {
                checks.push(_not(_call(_access(regexp, "test"), [validator.expression()])));
                errorMessages.push(...concat`to match ${validator.typeData.matches}`);
            }
        }

        if (validator.typeData.minLen) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.minLen, ts.SyntaxKind.LessThanToken));
            errorMessages.push(...concat`to have a length greater than ${validator.typeData.minLen}`);
        }

        if (validator.typeData.maxLen) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.maxLen, ts.SyntaxKind.GreaterThanToken));
            errorMessages.push(...concat`to have a length less than ${validator.typeData.maxLen}`);
        }

        return {
            condition: _or(checks),
            error: [validator, joinElements(errorMessages, ", ")]
        };
    }
    case TypeDataKinds.Boolean: return { 
        condition: validator.typeData.literal !== undefined ? _bin(validator.expression(), _bool(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken) : _typeof_cmp(validator.expression(), "boolean", ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [validator.typeData.literal !== undefined ? _str(`to be ${validator.typeData.literal}`) : _str("to be a boolean")]]
    };
    case TypeDataKinds.BigInt: return {
        condition: _typeof_cmp(validator.expression(), "bigint", ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [_str("to be a bigint")]]
    };
    case TypeDataKinds.Symbol: return {
        condition: _typeof_cmp(validator.expression(), "symbol", ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [_str("to be a symbol")]]
    };
    case TypeDataKinds.Class: return {
        condition: _not(_instanceof(validator.expression(), validator._original.symbol.name)),
        error: [validator, [_str(`to be an instance of "${validator._original.symbol.name}"`)]]
    };
    case TypeDataKinds.Function: return {
        condition: _typeof_cmp(validator.expression(), "function", ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [_str("to be a function")]]
    };
    case TypeDataKinds.Null: return {
        condition: _bin(validator.expression(), ts.factory.createNull(), ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [_str("to be null")]]
    };
    case TypeDataKinds.Undefined: return {
        condition: _bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken),
        error: [validator, [_str("to be undefined")]]
    };
    // Only way this will run is if the type parameter is optional and cannot be resolved from the call site
    case TypeDataKinds.Resolve: return {
        condition: _bool(false),
        error: [validator, [_str("to be a type parameter")]]
    };
    case TypeDataKinds.Recursive: {
        if (!ctx.recursiveFnNames.has(validator._original)) return { condition: _bool(false) };
        const fnName = ctx.recursiveFnNames.get(validator._original) as ts.Identifier;
        return {
            condition: _not(_call(fnName, [validator.expression()])),
            error: [validator, [_str(`to be ${ctx.transformer.checker.typeToString(validator._original)}`)]]
        };
    }
    case TypeDataKinds.Tuple: {
        const large: [number, ts.Identifier][] = [];
        const after = [];
        for (const child of validator.children) {
            if (!child.isRedirect() && child.weigh() > 5 && typeof child.name === "number") large.push([child.name, child.setAlias(() => _ident("t"))]);
            after.push(...validateType(child, ctx));
        }

        return {
            condition: _not(_call(_access(_ident("Array", true), "isArray"), [validator.expression()])),
            error: [validator, [_str("to be an array")]],
            before: large.length ? [ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([_arr_binding_decl(large, validator.expression())], ts.NodeFlags.Const))] : undefined,
            after
        };
    }
    case TypeDataKinds.If: {
        if (validator.typeData.fullCheck) {
            const innerGen = genNode(validator.children[0] as Validator, ctx);
            return {
                ...innerGen,
                after: [_if(_not(ctx.transformer.stringToNode(validator.typeData.expression, { $self: validator.expression() })), error(ctx, [validator, [_str(`to satisfy "${validator.typeData.expression}"`)]])), ...(innerGen.after || [])]
            };
        } else return {
            condition: _not(ctx.transformer.stringToNode(validator.typeData.expression, { $self: validator.expression() })),
            error: [validator, [_str(`to satisfy "${validator.typeData.expression}"`)]]
        };
    }
    case TypeDataKinds.Union: {
        // Special case - if there's an union just between an object and `null`, we expand the union because the object already checks for null
        if (validator.children.length === 2 && validator.hasChildrenOfKind(TypeDataKinds.Object, TypeDataKinds.Null)) return genNode(validator.getChildrenOfKind(TypeDataKinds.Object)[0] as Validator, ctx);

        const compoundTypes: GenResult[] = [], 
            normalTypeConditions: ts.Expression[] = [], 
            normalTypeErrors: GenResultError[] = [],
            objectTypes: GenResult[] = [],
            typeNames: string[] = [];
        let isNullable = false;
        const objectKind = validator.getChildCountOfKind(TypeDataKinds.Object);
        for (const child of validator.children) {
            if (child.typeData.kind === TypeDataKinds.Undefined) {
                isNullable = true;
                continue;
            }
            else if (child.children.length) {
                if (child.typeData.kind === TypeDataKinds.Object && objectKind > 1) {
                    const idRepresent = child.getFirstLiteralChild();
                    if (idRepresent) {
                        child.children.splice(child.children.indexOf(idRepresent), 1);
                        const node = genNode(child, ctx);
                        const childNode = genNode(idRepresent, ctx);
                        objectTypes.push({
                            condition: childNode.condition,
                            error: childNode.error,
                            after: node.after
                        });
                    }
                    else compoundTypes.push(genNode(child, ctx));
                }
                else compoundTypes.push(genNode(child, ctx));
            }
            else {
                const node = genNode(child, ctx);
                normalTypeConditions.push(node.condition);
                if (node.error) normalTypeErrors.push(node.error);
            }
            typeNames.push(ctx.transformer.checker.typeToString(child._original));
        }

        if (objectTypes.length) compoundTypes.push({
            condition: _obj_check(validator.expression()),
            after: [_if_nest(0, objectTypes.map(t => [t.condition, joinResultStmts(t)]), error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]]))]
        });

        if (!compoundTypes.length) return {
            condition: isNullable ? _and([isNullableNode(validator), ...normalTypeConditions]) : _and(normalTypeConditions),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            error: normalTypeConditions.length === 1 ? normalTypeErrors[0]! : [validator, [_str("to be one of "), _str(typeNames.join(", "))]],
        };
        else {
            if (!normalTypeConditions.length) {
                const firstCompound = compoundTypes.shift() as GenResult;
                if (isNullable) return {
                    condition: isNullableNode(validator),
                    ifTrue: [
                        _if(firstCompound.condition, error(ctx, firstCompound.error)),
                        ...joinResultStmts(firstCompound),
                        _if_nest(0, compoundTypes.map(t => [t.condition, joinResultStmts(t)]), ts.factory.createEmptyStatement())
                    ]
                };
                else return {
                    condition: isNullable ? isNullableNode(validator) : firstCompound.condition,
                    ifTrue: isNullable ? _if(firstCompound.condition, _if_nest(0, compoundTypes.map(t => [t.condition, joinResultStmts(t)]), error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]]))) : _if_nest(0, compoundTypes.map(t => [t.condition, t.after || []]), error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]])),
                    ifFalse: joinResultStmts(firstCompound)
                };
            }
            else return {
                condition: isNullable ? _and([isNullableNode(validator), ...normalTypeConditions]) : _and(normalTypeConditions),
                ifTrue: _if_nest(0, compoundTypes.map(t => [t.condition, joinResultStmts(t)]), error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]]))
            };
        }
    }
    case TypeDataKinds.Array: {
        const checks = [_not(_call(_access(_ident("Array", true), "isArray"), [validator.expression()]))], errorMessages: Stringifyable[] = ["to be an array"];

        if (validator.typeData.length) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.length, ts.SyntaxKind.ExclamationEqualsEqualsToken));
            errorMessages.push(...concat`to have a length of ${validator.typeData.length}`);
        }
    
        if (validator.typeData.minLen) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.minLen, ts.SyntaxKind.LessThanToken));
            errorMessages.push(...concat`to have a length greater than ${validator.typeData.minLen}`);
        }
    
        if (validator.typeData.maxLen) {
            checks.push(_bin(_access(validator.expression(), "length"), validator.typeData.maxLen, ts.SyntaxKind.GreaterThanToken));
            errorMessages.push(...concat`to have a length less than ${validator.typeData.maxLen}`);
        }

        const childType = validator.children[0];
        if (!childType) return {
            condition: _or(checks),
            error: [validator, joinElements(errorMessages, ", ")],
        };
        
        const [lenStmt, len] = _var("len", _access(validator.expression(), "length"), ts.NodeFlags.Const);

        let index: ts.Identifier;
        if (typeof childType.name === "object") index = childType.name;
        else {
            index = _ident("i");
            childType.setName(index);
        }

        return {
            condition: _or(checks),
            error: [validator, joinElements(errorMessages, ", ")],
            after: [_for(validator.expression(), index, validateType(childType, ctx), len)[0]],
            before: [lenStmt]
        };
    }
    case TypeDataKinds.Object: {
        const checks: ts.Statement[] = [];
        const names: [string, ts.Identifier][] = [];
        for (const child of validator.children) {
            if (!child.isRedirect() && child.weigh() > 5 && typeof child.name === "string") names.push([child.name, child.setAlias(() => _ident(child.name as string))]);
            checks.push(...validateType(child, ctx));
        }

        const exactProps = validator.exactProps();
        if (exactProps !== undefined) {
            const name = _ident("p");
            checks.push(_for_in(validator.expression(), name, [
                _if(
                    _and(validator.children.filter(c => typeof c.name === "string").map(c => _bin(name, _str(c.name as string), ts.SyntaxKind.ExclamationEqualsEqualsToken))),
                    exactProps === ObjectTypeDataExactOptions.RaiseError ? error(ctx, [validator, joinElements(["Property ", ...validator.path(), ".", name, " is excessive"])], true) : validator.typeData.useDeleteOperator ? ts.factory.createDeleteExpression(_access(validator.expression(), name)) : _bin(_access(validator.expression(), name), UNDEFINED, ts.SyntaxKind.EqualsToken)
                )
            ])[0]);
        }

        return {
            condition: _obj_check(validator.expression()),
            error: [validator, [_str("to be an object")]],
            before: names.length ? [ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([_obj_binding_decl(names, validator.expression())], ts.NodeFlags.Const))] : undefined,
            after: checks
        };
    }
    default: throw new Error("Unexpected TypeDataKind.");
    }
}

export function isNullableNode(validator: Validator) : ts.Expression {
    return _bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken);
}

export function genStatements(results: GenResult[], ctx: NodeGenContext) : ts.Statement[] {
    const result = [];
    for (const genResult of results) {
        result.push(_if(genResult.condition, (genResult.ifTrue ? genResult.ifTrue : error(ctx, genResult.error)) as BlockLike, genResult.ifFalse));
        if (genResult.before) result.push(...genResult.before);
        if (genResult.after) result.push(...genResult.after);
    }
    return [...ctx.recursiveFns, ...result];
}

export function validateType(validator: Validator, ctx: NodeGenContext, isOptional?: boolean, gen?: GenResult) : ts.Statement[] {
    const genResult = gen || genNode(validator, ctx);
    const node = ctx.resultType.return ? minimizeGenResult(genResult, ctx) : genResult;
    if (isOptional) {
        if (node.after || node.ifFalse || node.ifTrue || node.before) return [_if(isNullableNode(validator), genStatements([node], ctx))];
        else return genStatements([{
            ...node,
            condition: _and([isNullableNode(validator), node.condition])
        }], ctx);
    }
    else return genStatements([node], ctx);
}

export function minimizeGenResult(result: GenResult, ctx: NodeGenContext, negate?: boolean) : GenResult {
    if (result.ifFalse) return result;
    const _join = negate ? _and : _or;
    const _negate = negate ? _not : <T>(exp: T) => exp;

    const ifStatements: ts.Expression[] = [];
    let condition = _negate(result.condition), other: ts.Statement[] = [];

    if (result.ifTrue) {
        const block = _concise(result.ifTrue);
        if (ts.isExpression(block)) ifStatements.push(_negate(block));
        else if (block.statements.every(stmt => (ts.isIfStatement(stmt) && !stmt.elseStatement && ts.isReturnStatement(stmt.thenStatement)) || ts.isEmptyStatement(stmt))) {
            const exps = [];
            for (const nestedIf of block.statements) {
                if (ts.isEmptyStatement(nestedIf)) continue;
                exps.push(_negate((nestedIf as ts.IfStatement).expression));
            }
            condition = _ternary(condition, _join(exps), ctx.resultType.return as ts.Expression);
        }
        else return result;
    }
    
    if (result.after) {
        for (const stmt of result.after) {
            if (ts.isIfStatement(stmt) && ts.isReturnStatement(stmt.thenStatement) && !stmt.elseStatement) ifStatements.push(_negate(stmt.expression));
            else other.push(stmt);
        }
    }

    if (result.before && ifStatements.length) {
        const heavy = [], light = [];
        for (const stmt of other) {
            if (ts.isForStatement(stmt)) heavy.push(stmt);
            else light.push(stmt);
        }
        light.push(_if(_join(ifStatements), error(ctx, result.error)));
        other = [...light, ...heavy];
    }
    else condition = _join([condition, ...ifStatements]);

    return {
        condition,
        after: other.length ? other : undefined,
        before: result.before,
        error: result.error,
        minimzed: true
    };
}