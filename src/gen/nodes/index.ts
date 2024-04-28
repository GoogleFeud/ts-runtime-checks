import ts, {isNumericLiteral} from "typescript";
import {CheckTypeData, ObjectTypeDataExactOptions, TypeDataKinds, Validator, genValidator} from "../validators";
import {
    _and,
    _bin,
    _bin_chain,
    _for,
    _if,
    _new,
    _not,
    _num,
    _or,
    _str,
    _throw,
    _typeof_cmp,
    BlockLike,
    UNDEFINED,
    concat,
    joinElements,
    _if_nest,
    _instanceof,
    _access,
    _call,
    _for_in,
    _ident,
    _bool,
    _obj_check,
    _obj,
    _obj_binding_decl,
    _arr_binding_decl,
    _concise,
    _ternary,
    _arr_check,
    _var
} from "../expressionUtils";
import {Transformer} from "../../transformer";
import {TransformerError, isSingleIfStatement} from "../../utils";

export interface ValidationResultType {
    throw?: string | ts.Symbol;
    return?: ts.Expression;
    returnErr?: boolean;
    custom?: (msg: ts.Expression) => ts.Statement;
    rawErrors?: boolean;
    none?: boolean;
}

export interface NodeGenContext {
    transformer: Transformer;
    resultType: ValidationResultType;
    recursiveFns: ts.FunctionDeclaration[];
    recursiveFnNames: Map<ts.Type, ts.Identifier>;
    resolvedTypeArguments: Map<ts.Type, Validator>;
    origin: ts.Node;
    useElse?: boolean;
}

export function createContext(transformer: Transformer, resultType: ValidationResultType, origin: ts.Node, useElse?: boolean): NodeGenContext {
    return {
        transformer,
        resultType,
        useElse,
        recursiveFns: [],
        recursiveFnNames: new Map(),
        resolvedTypeArguments: new Map(),
        origin
    };
}

export type GenResultError = [validator: Validator, message: ts.Expression[]];

export interface GenResult {
    condition: ts.Expression;
    error?: GenResultError;
    ifTrue?: BlockLike;
    ifFalse?: BlockLike;
    after?: ts.Statement[];
    before?: ts.Statement[];
    minimzed?: boolean;
}

export function joinResultStmts(result: GenResult): ts.Statement[] {
    return [...(result.before || []), ...(result.after || [])];
}

export function error(ctx: NodeGenContext, error?: GenResultError, isFull = false): ts.Statement {
    if (ctx.resultType.none) return ts.factory.createReturnStatement();
    if (ctx.resultType.return) return ts.factory.createReturnStatement(ctx.resultType.return);
    if (!error) return ts.factory.createReturnStatement();
    const finalMsg = ctx.resultType.rawErrors
        ? _obj({
              value: error[0].expression(),
              valueName: _bin_chain(joinElements(error[0].path()), ts.SyntaxKind.PlusToken),
              expectedType: _obj(error[0].getRawTypeData() as unknown as Record<string, ts.Expression>)
          })
        : _bin_chain(isFull ? error[1] : joinElements(["Expected ", ...error[0].path(), " ", ...error[1]]), ts.SyntaxKind.PlusToken);
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(finalMsg);
    else if (ctx.resultType.throw) {
        let throwClass;
        if (typeof ctx.resultType.throw === "string") throwClass = ctx.resultType.throw;
        else {
            const imported = ctx.transformer.symbolsToImport.identifierMap.get(ctx.resultType.throw);
            throwClass = imported || ctx.resultType.throw.name;
        }
        return _throw(_new(throwClass, [finalMsg]));
    } else if (ctx.resultType.custom) return ctx.resultType.custom(finalMsg);
    else return _throw(_new("Error", [finalMsg]));
}

export function genNode(validator: Validator, ctx: NodeGenContext): GenResult {
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
                resultType: {return: _bool(false)}
            });
            ctx.recursiveFns.push(
                ts.factory.createFunctionDeclaration(
                    undefined,
                    undefined,
                    uniqueName,
                    undefined,
                    [ts.factory.createParameterDeclaration(undefined, undefined, typeValidator.customExp as ts.Identifier, undefined, undefined, undefined)],
                    undefined,
                    ts.factory.createBlock(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        statements.length === 1 && isSingleIfStatement(statements[0]!)
                            ? [ts.factory.createReturnStatement(_not(statements[0].expression))]
                            : [...statements, ts.factory.createReturnStatement(_bool(true))]
                    )
                )
            );
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
            if (validator.typeData.literal !== undefined)
                return {
                    condition: _bin(validator.expression(), _num(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
                    error: [validator, concat`to be equal to ${validator.typeData.literal.toString()}`]
                };
            return {
                condition: _typeof_cmp(validator.expression(), "number", ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be a number")]]
            };
        }
        case TypeDataKinds.String: {
            if (validator.typeData.literal !== undefined)
                return {
                    condition: _bin(validator.expression(), _str(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken),
                    error: [validator, concat`to be equal to "${validator.typeData.literal}"`]
                };
            return {
                condition: _typeof_cmp(validator.expression(), "string", ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be a string")]]
            };
        }
        case TypeDataKinds.Boolean:
            return {
                condition:
                    validator.typeData.literal !== undefined
                        ? _bin(validator.expression(), _bool(validator.typeData.literal), ts.SyntaxKind.ExclamationEqualsEqualsToken)
                        : _and([
                              _bin(validator.expression(), _bool(false), ts.SyntaxKind.ExclamationEqualsEqualsToken),
                              _bin(validator.expression(), _bool(true), ts.SyntaxKind.ExclamationEqualsEqualsToken)
                          ]),
                error: [validator, [validator.typeData.literal !== undefined ? _str(`to be ${validator.typeData.literal}`) : _str("to be a boolean")]]
            };
        case TypeDataKinds.BigInt:
            return {
                condition: _typeof_cmp(validator.expression(), "bigint", ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be a bigint")]]
            };
        case TypeDataKinds.Symbol:
            return {
                condition: _typeof_cmp(validator.expression(), "symbol", ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be a symbol")]]
            };
        case TypeDataKinds.Class:
            return {
                condition: _not(_instanceof(validator.expression(), validator._original.symbol.name)),
                error: [validator, [_str(`to be an instance of "${validator._original.symbol.name}"`)]]
            };
        case TypeDataKinds.Function:
            return {
                condition: _typeof_cmp(validator.expression(), "function", ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be a function")]]
            };
        case TypeDataKinds.Null:
            return {
                condition: _bin(validator.expression(), ts.factory.createNull(), ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be null")]]
            };
        case TypeDataKinds.Undefined:
            return {
                condition: _bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken),
                error: [validator, [_str("to be undefined")]]
            };
        case TypeDataKinds.Resolve: {
            const resolved = ctx.resolvedTypeArguments.get(validator._original);
            if (!resolved)
                return {
                    condition: _bool(false),
                    error: [validator, [_str("to be a type parameter")]]
                };
            return genNode(resolved, ctx);
        }
        case TypeDataKinds.Recursive: {
            if (!ctx.recursiveFnNames.has(validator._original)) return {condition: _bool(false)};
            const fnName = ctx.recursiveFnNames.get(validator._original) as ts.Identifier;
            return {
                condition: _not(_call(fnName, [validator.expression()])),
                error: [validator, [_str(`to be ${ctx.transformer.checker.typeToString(validator._original)}`)]]
            };
        }
        case TypeDataKinds.Tuple: {
            const large: [number, ts.Identifier][] = [];
            const after = [];
            const isLarge = validator.children.some(child => !child.isRedirect() && child.weigh() > 4 && typeof child.name === "number");
            for (const child of validator.children) {
                if (isLarge) large.push([child.name as number, child.setAlias(() => _ident("t"))]);
                after.push(...validateType(child, ctx));
            }

            return {
                condition: _not(_arr_check(validator.expression())),
                error: [validator, [_str("to be an array")]],
                before: large.length
                    ? [ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([_arr_binding_decl(large, validator.expression())], ts.NodeFlags.Const))]
                    : undefined,
                after
            };
        }
        case TypeDataKinds.Check: {
            const normalChecks = [],
                errorMessages = validator.typeData.hints
                    .filter(h => h.error)
                    .map(h => h.error)
                    .join(", ");
            let after, before, errorMsg;
            if (validator.children.length) {
                const first = genNode(validator.children[0] as Validator, ctx);
                normalChecks.push(first.condition);
                after = first.after;
                before = first.before;
                errorMsg = first.error;
            }
            normalChecks.push(...genChecks(validator.typeData.expressions, validator, ctx, true));
            return {
                condition: _or(normalChecks),
                after,
                before,
                error: [validator, errorMsg ? [...errorMsg[1], _str(", "), _str(errorMessages)] : [_str(errorMessages)]]
            };
        }
        case TypeDataKinds.Union: {
            const {compound, normal, object, isNullable} = getUnionMembers(validator.children);

            const normalTypeConditions = [],
                normalTypeErrors = [];
            const compoundTypes = compound.map(c => genNode(c, ctx));
            const typeNames = validator.children.map(c => ctx.transformer.checker.typeToString(c._original));

            for (const normalCheck of normal) {
                const node = genNode(normalCheck, ctx);
                normalTypeConditions.push(node.condition);
                if (node.error) normalTypeErrors.push(node.error);
            }

            if (object.length)
                compoundTypes.push({
                    condition: _obj_check(validator.expression()),
                    after: [
                        _if_nest(
                            0,
                            object.map(([childNode, propNode]) => [genNode(propNode, ctx).condition, joinResultStmts(genNode(childNode, ctx))]),
                            error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]])
                        )
                    ]
                });

            if (!compoundTypes.length)
                return {
                    condition: isNullable ? _and([isNullableNode(validator), ...normalTypeConditions]) : _and(normalTypeConditions),
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    error: normalTypeConditions.length === 1 ? normalTypeErrors[0]! : [validator, [_str("to be one of "), _str(typeNames.join(", "))]]
                };
            else {
                if (!normalTypeConditions.length) {
                    const firstCompound = compoundTypes.shift() as GenResult;
                    if (isNullable)
                        return {
                            condition: isNullableNode(validator),
                            ifTrue: [
                                _if(firstCompound.condition, error(ctx, firstCompound.error)),
                                ...joinResultStmts(firstCompound),
                                _if_nest(
                                    0,
                                    compoundTypes.map(t => [t.condition, joinResultStmts(t)]),
                                    ts.factory.createEmptyStatement()
                                )
                            ]
                        };
                    else
                        return {
                            condition: isNullable ? isNullableNode(validator) : firstCompound.condition,
                            ifTrue: isNullable
                                ? _if(
                                      firstCompound.condition,
                                      _if_nest(
                                          0,
                                          compoundTypes.map(t => [t.condition, joinResultStmts(t)]),
                                          error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]])
                                      )
                                  )
                                : _if_nest(
                                      0,
                                      compoundTypes.map(t => [t.condition, t.after || []]),
                                      error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]])
                                  ),
                            ifFalse: joinResultStmts(firstCompound)
                        };
                } else
                    return {
                        condition: isNullable ? _and([isNullableNode(validator), ...normalTypeConditions]) : _and(normalTypeConditions),
                        ifTrue: _if_nest(
                            0,
                            compoundTypes.map(t => [t.condition, joinResultStmts(t)]),
                            error(ctx, [validator, [_str("to be one of "), _str(typeNames.join(", "))]])
                        )
                    };
            }
        }
        case TypeDataKinds.Array: {
            const childType = validator.children[0];
            if (!childType)
                return {
                    condition: _not(_call(_access(_ident("Array", true), "isArray"), [validator.expression()])),
                    error: [validator, [_str("to be an array")]]
                };

            let index: ts.Identifier;
            if (typeof childType.name === "object") index = childType.name;
            else {
                index = _ident("i");
                childType.setName(index);
            }

            return {
                condition: _not(_arr_check(validator.expression())),
                error: [validator, [_str("to be an array")]],
                after: [_for(validator.expression(), index, validateType(childType, ctx))[0]]
            };
        }
        case TypeDataKinds.Object: {
            const checks: ts.Statement[] = [];
            const names: [string, ts.Identifier][] = [];
            for (const child of validator.children) {
                if (!child.isRedirect() && child.weigh() > 4 && typeof child.name === "string") names.push([child.name, child.setAlias(() => _ident(child.name as string))]);
                checks.push(...validateType(child, ctx));
            }

            const exactProps = validator.exactProps();
            if (exactProps !== undefined && validator.children.length) {
                const name = _ident("p");
                checks.push(
                    _for_in(validator.expression(), name, [
                        _if(
                            _and(validator.children.filter(c => typeof c.name === "string").map(c => _bin(name, _str(c.name as string), ts.SyntaxKind.ExclamationEqualsEqualsToken))),
                            exactProps === ObjectTypeDataExactOptions.RaiseError
                                ? error(ctx, [validator, joinElements(["Property ", ...validator.path(), ".", name, " is excessive"])], true)
                                : validator.typeData.useDeleteOperator
                                  ? ts.factory.createDeleteExpression(_access(validator.expression(), name))
                                  : _bin(_access(validator.expression(), name), UNDEFINED, ts.SyntaxKind.EqualsToken)
                        )
                    ])[0]
                );
            }

            if (validator.typeData.stringIndexInfo || validator.typeData.numberIndexInfo) {
                const keyName = _ident("p");
                let finalCheck: BlockLike = [];

                if (validator.typeData.stringIndexInfo) {
                    const [indexType, valueType] = validator.typeData.stringIndexInfo;
                    let stringCond, stringErr;
                    if (indexType.typeData.kind === TypeDataKinds.Check) {
                        indexType.setCustomExpression(keyName);
                        indexType.setChildren([]);
                        const node = genNode(indexType, ctx);
                        stringCond = node.condition;
                        stringErr = [validator, joinElements(["Expected key ", keyName, " of ", ...validator.path(), " ", ...(node.error?.[1] || [])])] as [Validator, ts.Expression[]];
                    }
                    valueType.setName(keyName);
                    finalCheck = stringCond ? [_if(stringCond, error(ctx, stringErr, true)), ...validateType(valueType, ctx)] : validateType(valueType, ctx);
                }

                if (validator.typeData.numberIndexInfo) {
                    const [indexType, valueType] = validator.typeData.numberIndexInfo;
                    valueType.setName(keyName);
                    const typeCheck = _not(_call(_ident("isNaN", true), [keyName]));
                    let checkBody;
                    if (indexType.typeData.kind === TypeDataKinds.Check) {
                        const [stmt, ident] = _var("numKey", _call(_ident("parseFloat", true), [keyName]), ts.NodeFlags.Const);
                        indexType.setCustomExpression(ident);
                        indexType.setName(keyName);
                        indexType.setChildren([]);
                        const indexTypeCheck = genNode(indexType, ctx);
                        checkBody = [
                            stmt,
                            _if(
                                indexTypeCheck.condition,
                                error(ctx, [validator, joinElements(["Expected key ", keyName, " of ", ...validator.path(), " ", ...(indexTypeCheck.error?.[1] || [])])], true)
                            ),
                            ...validateType(valueType, ctx)
                        ];
                    } else checkBody = validateType(valueType, ctx);

                    if (finalCheck) finalCheck = _if(typeCheck, checkBody, finalCheck);
                    else finalCheck = _if(typeCheck, checkBody, error(ctx, [validator, joinElements(["Expected key ", keyName, " of ", ...validator.path(), " to be a number"])], true));
                }

                checks.push(_for_in(validator.expression(), keyName, finalCheck)[0]);
            }

            return {
                condition: _obj_check(validator.expression(), validator.typeData.couldBeNull),
                error: [validator, [_str("to be an object")]],
                before: names.length
                    ? [ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([_obj_binding_decl(names, validator.expression())], ts.NodeFlags.Const))]
                    : undefined,
                after: checks
            };
        }
        case TypeDataKinds.Transform: {
            const base = validator.typeData.rest;
            if (!base) throw TransformerError(ctx.origin, "Transform has no base type.");
            return genNode(base, ctx);
        }
        default:
            throw TransformerError(ctx.origin, "Unexpected TypeDataKind.");
    }
}

export function genChecks(checks: CheckTypeData["expressions"], validator: Validator, ctx: NodeGenContext, negate?: boolean): ts.Expression[] {
    const result = [];
    let parseCtx;
    for (const check of checks) {
        if (typeof check === "string") {
            if (!parseCtx) parseCtx = genCheckCtx(validator);
            const value = ctx.transformer.stringToNode(check, parseCtx);
            result.push(negate ? _not(value) : value);
        } else {
            const importedSym = ctx.transformer.importSymbol(check, ctx.origin);
            if (!importedSym) continue;
            const value = _call(importedSym, [validator.expression()]);
            result.push(negate ? _not(value) : value);
        }
    }
    return result;
}

export function isNullableNode(validator: Validator): ts.Expression {
    return _bin(validator.expression(), UNDEFINED, ts.SyntaxKind.ExclamationEqualsEqualsToken);
}

export function getUnionMembers(validators: Validator[]): {
    compound: Validator[];
    normal: Validator[];
    object: [Validator, Validator][];
    isNullable: boolean;
} {
    const compoundTypes: Validator[] = [],
        normalTypes: Validator[] = [],
        objectTypes: [Validator, Validator][] = [];
    let isNullable = false;
    const objectKind = validators.filter(v => v.typeData.kind === TypeDataKinds.Object).length;
    for (const child of validators) {
        if (child.typeData.kind === TypeDataKinds.Undefined) {
            isNullable = true;
            continue;
        } else if (child.children.length && child.typeData.kind === TypeDataKinds.Object && objectKind > 1) {
            const idRepresent = child.getFirstLiteralChild();
            if (idRepresent) {
                child.children.splice(child.children.indexOf(idRepresent), 1);
                objectTypes.push([child, idRepresent]);
            } else compoundTypes.push(child);
        } else if (child.isComplexType()) compoundTypes.push(child);
        else normalTypes.push(child);
    }
    return {
        compound: compoundTypes,
        normal: normalTypes,
        object: objectTypes,
        isNullable
    };
}

export function genCheckCtx(validator: Validator) {
    return {
        $self: validator.expression(),
        $parent: (index?: ts.Expression) => {
            let parentToGet = index && isNumericLiteral(index) ? +index.text : 0;
            let parent = validator.parent;
            while (parent && parentToGet--) parent = parent.parent;
            return parent ? parent.expression() : UNDEFINED;
        }
    };
}

export function genStatements(results: GenResult[], ctx: NodeGenContext): ts.Statement[] {
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

export function validateType(validator: Validator, ctx: NodeGenContext, isOptional?: boolean): ts.Statement[] {
    const genResult = genNode(validator, ctx);
    const node = ctx.resultType.return ? minimizeGenResult(genResult, ctx) : genResult;
    if (isOptional) {
        if (node.after || node.ifFalse || node.ifTrue || node.before) return [_if(isNullableNode(validator), genStatements([node], ctx))];
        else
            return genStatements(
                [
                    {
                        ...node,
                        condition: _and([isNullableNode(validator), node.condition])
                    }
                ],
                ctx
            );
    } else return genStatements([node], ctx);
}

export function fullValidate(validator: Validator, ctx: NodeGenContext, isOptional?: boolean): ts.Statement[] {
    const stmts = validateType(validator, ctx, isOptional);
    return [...ctx.recursiveFns, ...stmts];
}

export function minimizeGenResult(result: GenResult, ctx: NodeGenContext, negate?: boolean): GenResult {
    if (result.ifFalse) return result;
    const _join = negate ? _and : _or;
    const _negate = negate ? _not : <T>(exp: T) => exp;

    const ifStatements: ts.Expression[] = [];
    let condition = _negate(result.condition),
        other: ts.Statement[] = [];

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
        } else return result;
    }

    if (result.after) {
        for (const stmt of result.after) {
            if (isSingleIfStatement(stmt)) ifStatements.push(_negate(stmt.expression));
            else other.push(stmt);
        }
    }

    if (result.before && ifStatements.length) {
        const heavy = [],
            light = [];
        for (const stmt of other) {
            if (ts.isForStatement(stmt)) heavy.push(stmt);
            else light.push(stmt);
        }
        light.push(_if(_join(ifStatements), error(ctx, result.error)));
        other = [...light, ...heavy];
    } else condition = _join([condition, ...ifStatements]);

    return {
        condition,
        after: other.length ? other : undefined,
        before: result.before,
        error: result.error,
        minimzed: true
    };
}
