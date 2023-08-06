import ts, { isNumericLiteral } from "typescript";
import { ObjectTypeDataExactOptions, TypeDataKinds, Validator, genValidator } from "../validators";
import { _and, _bin, _bin_chain, _for, _if, _new, _not, _num, _or, _str, _throw, _typeof_cmp, BlockLike, UNDEFINED, concat, joinElements, _if_nest, _instanceof, _access, _call, _for_in, _ident, _bool, _obj_check, _obj, _obj_binding_decl, _arr_binding_decl, _concise, _ternary } from "../expressionUtils";
import { Transformer } from "../../transformer";
import { isSingleIfStatement } from "../../utils";

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
    useElse?: boolean,
    recursiveFns: ts.FunctionDeclaration[],
    recursiveFnNames: Map<ts.Type, ts.Identifier>
}

export function createContext(transformer: Transformer, resultType: ValidationResultType, useElse?: boolean) : NodeGenContext {
    return {
        transformer,
        resultType,
        useElse,
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
        expectedType: _obj(error[0].getRawTypeData() as unknown as Record<string, ts.Expression>)
    }) : _bin_chain(isFull ? error[1] : joinElements(["Expected ", ...error[0].path(), " ", ...error[1]]), ts.SyntaxKind.PlusToken);
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(finalMsg);
    else if (ctx.resultType.throw) return _throw(_new(ctx.resultType.throw, [finalMsg]));
    else if (ctx.resultType.custom) return ctx.resultType.custom(finalMsg);
    else return _throw(_new("Error", [finalMsg]));
}

export function genNode(validator: Validator, ctx: NodeGenContext) : GenResult {

    if (validator.recursiveOrigins.length) {
        const types = validator.recursiveOrigins;
        const name = typeof validator.name === "string" ? validator.name : "_recursive";
        const innerValidators: [ts.Identifier, Validator][] = [];
        let calledName;

        for (const type of types) {
            const uniqueName = _ident(name);
            const paramName = _ident("param");
            const typeValidator = genValidator(ctx.transformer, type, validator.name, paramName);
            if (!typeValidator) continue;
            typeValidator.recursiveOrigins.length = 0;
            ctx.recursiveFnNames.set(type, uniqueName);
            innerValidators.push([uniqueName, typeValidator]);
            if (validator._original === type) calledName = uniqueName;
        }

        for (const [uniqueName, typeValidator] of innerValidators) {
            const statements = validateType(typeValidator, {
                ...ctx,
                resultType: { return: _bool(false) }
            });
            ctx.recursiveFns.push(ts.factory.createFunctionDeclaration(undefined, undefined, uniqueName, undefined,
                [ts.factory.createParameterDeclaration(undefined, undefined, typeValidator.customExp as ts.Identifier, undefined, undefined, undefined)],
                undefined,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ts.factory.createBlock(statements.length === 1 && isSingleIfStatement(statements[0]!) ? [ts.factory.createReturnStatement(_not(statements[0].expression))] : [...statements, ts.factory.createReturnStatement(_bool(true))])
            ));
        }

        if (!calledName) {
            validator.recursiveOrigins.length = 0;
            return genNode(validator, ctx);
        }

        return {
            condition: _not(_call(calledName as ts.Identifier, [validator.expression()])),
            error: [validator, [_str(`to be ${ctx.transformer.checker.typeToString(validator._original)}`)]]
        };
    }
    
    switch (validator.typeData.kind) {
    case TypeDataKinds.Number: {
        if (validator.typeData.literal !== undefined) return {
            condition: _bin(validator.expression(), _num(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, concat`to be equal to ${validator.typeData.literal.toString()}`]
        };
        return {
            condition: _typeof_cmp(validator.expression(), "number", ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, [_str("to be a number")]]
        };
    }
    case TypeDataKinds.String: {
        if (validator.typeData.literal !== undefined) return {
            condition: _bin(validator.expression(), _str(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, concat`to be equal to "${validator.typeData.literal}"`]
        };
        return {
            condition: _typeof_cmp(validator.expression(), "string", ts.SyntaxKind.ExclamationEqualsEqualsToken),
            error: [validator, [_str("to be a string")]]
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
    case TypeDataKinds.Check: {
        const normalChecks = [], errorMessages = validator.typeData.hints.filter(h => h.error).map(h => h.error).join(", ");
        let after, before, errorMsg;
        if (validator.children.length) {
            const first = genNode(validator.children[0] as Validator, ctx);
            normalChecks.push(first.condition);
            after = first.after;
            before = first.before;
            errorMsg = first.error;
        }
        const parseCtx = {
            $self: validator.expression(),
            $parent: (index?: ts.Expression) => {
                let parentToGet = index && isNumericLiteral(index) ? +index.text : 0; 
                let parent = validator.parent;
                while (parent && parentToGet--) parent = parent.parent;
                return parent ? parent.expression() : UNDEFINED;
            }};
        for (const check of validator.typeData.expressions) normalChecks.push(_not(ctx.transformer.stringToNode(check, parseCtx)));
        return {
            condition: _or(normalChecks),
            after,
            before,
            error: [validator, errorMsg ? [...errorMsg[1], _str(", "), _str(errorMessages)] : [_str(errorMessages)]]
        };
    }
    case TypeDataKinds.Union: {
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
            else if (child.children.length && child.typeData.kind === TypeDataKinds.Object && objectKind > 1) {
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
            else if (child.isComplexType()) compoundTypes.push(genNode(child, ctx));
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
        const childType = validator.children[0];
        if (!childType) return {
            condition: _not(_call(_access(_ident("Array", true), "isArray"), [validator.expression()])),
            error: [validator, [_str("to be an array")]],
        };

        let index: ts.Identifier;
        if (typeof childType.name === "object") index = childType.name;
        else {
            index = _ident("i");
            childType.setName(index);
        }

        return {
            condition: _not(_call(_access(_ident("Array", true), "isArray"), [validator.expression()])),
            error: [validator, [_str("to be an array")]],
            after: [_for(validator.expression(), index, validateType(childType, ctx))[0]],
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
        if (exactProps !== undefined && validator.children.length) {
            const name = _ident("p");
            checks.push(_for_in(validator.expression(), name, [
                _if(
                    _and(validator.children.filter(c => typeof c.name === "string").map(c => _bin(name, _str(c.name as string), ts.SyntaxKind.ExclamationEqualsEqualsToken))),
                    exactProps === ObjectTypeDataExactOptions.RaiseError ? error(ctx, [validator, joinElements(["Property ", ...validator.path(), ".", name, " is excessive"])], true) : validator.typeData.useDeleteOperator ? ts.factory.createDeleteExpression(_access(validator.expression(), name)) : _bin(_access(validator.expression(), name), UNDEFINED, ts.SyntaxKind.EqualsToken)
                )
            ])[0]);
        }

        if (validator.typeData.numberIndexType || validator.typeData.stringIndexType) {
            const innerChecks = [];
            const keyName = _ident("p");
            if (validator.typeData.numberIndexType) {
                const numberKeyValidator = genValidator(ctx.transformer, validator.typeData.numberIndexType, keyName, undefined, validator);
                if (numberKeyValidator) innerChecks.push(_if(_not(_call(_ident("isNaN", true), [keyName])), validateType(numberKeyValidator, ctx)));
            }
            if (validator.typeData.stringIndexType) {
                const stringKeyValidator = genValidator(ctx.transformer, validator.typeData.stringIndexType, keyName, undefined, validator);
                if (stringKeyValidator) innerChecks.push(_if(_typeof_cmp(keyName, "string"), validateType(stringKeyValidator, ctx)));
            }
            checks.push(_for_in(validator.expression(), keyName, 
                validator.children.length ? _if(
                    _and(validator.children.filter(c => typeof c.name === "string").map(c => _bin(keyName, _str(c.name as string), ts.SyntaxKind.ExclamationEqualsEqualsToken))),
                    innerChecks
                ) : innerChecks
            )[0]);
        }

        return {
            condition: _obj_check(validator.expression(), validator.typeData.couldBeNull),
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
        if (ctx.useElse && genResult.after) result.push(_if(genResult.condition, error(ctx, genResult.error), joinResultStmts(genResult)));
        else {
            result.push(_if(genResult.condition, (genResult.ifTrue ? genResult.ifTrue : error(ctx, genResult.error)) as BlockLike, genResult.ifFalse));
            if (genResult.before) result.push(...genResult.before);
            if (genResult.after) result.push(...genResult.after);
        }
    }
    return [...result];
}

export function validateType(validator: Validator, ctx: NodeGenContext, isOptional?: boolean) : ts.Statement[] {
    const genResult = genNode(validator, ctx);
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

export function fullValidate(validator: Validator, ctx: NodeGenContext, isOptional?: boolean) : ts.Statement[] {
    const stmts = validateType(validator, ctx, isOptional);
    return [...ctx.recursiveFns, ...stmts];
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
            if (isSingleIfStatement(stmt)) ifStatements.push(_negate(stmt.expression));
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