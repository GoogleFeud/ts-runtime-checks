import ts from "typescript";
import {CheckTypeData, CheckTypeHint, ObjectTypeData, ObjectTypeDataExactOptions, TypeDataKinds, Validator, ValidatorTargetName} from "./validator";
import {getCallSigFromType, getResolvedTypesFromCallSig, hasBit, isTrueType} from "../../utils";
import {Transformer} from "../../transformer";

export type CodeReference = string | ts.Symbol;

export function genValidator(transformer: Transformer, type: ts.Type | undefined, name: ValidatorTargetName, exp?: ts.Expression, parent?: Validator): Validator | undefined {
    if (!type) return;

    if (parent) {
        const recurive = parent.getParentWithType(type);
        if (recurive) {
            recurive.recursiveOrigins.push(type);
            return new Validator(type, name, {kind: TypeDataKinds.Recursive}, exp, parent);
        }
    }

    if (type.isStringLiteral()) return new Validator(type, name, {kind: TypeDataKinds.String, literal: type.value}, exp, parent);
    else if (type.isNumberLiteral()) return new Validator(type, name, {kind: TypeDataKinds.Number, literal: type.value}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.String) || hasBit(type, ts.TypeFlags.TemplateLiteral)) return new Validator(type, name, {kind: TypeDataKinds.String}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Number)) return new Validator(type, name, {kind: TypeDataKinds.Number}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.BigInt)) return new Validator(type, name, {kind: TypeDataKinds.BigInt}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Boolean)) return new Validator(type, name, {kind: TypeDataKinds.Boolean}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.ESSymbol)) return new Validator(type, name, {kind: TypeDataKinds.Symbol}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Null)) return new Validator(type, name, {kind: TypeDataKinds.Null}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Undefined)) return new Validator(type, name, {kind: TypeDataKinds.Undefined}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.BooleanLiteral)) return new Validator(type, name, {kind: TypeDataKinds.Boolean, literal: isTrueType(type)}, exp, parent);
    else if (hasBit(type, ts.TypeFlags.AnyOrUnknown)) return;
    else if (type.isClass()) return new Validator(type, name, {kind: TypeDataKinds.Class}, exp, parent);
    else if (type.isTypeParameter()) return;
    else if (transformer.checker.isTupleType(type))
        return new Validator(type, name, {kind: TypeDataKinds.Tuple}, exp, parent, (parent: Validator) =>
            transformer.checker.getTypeArguments(type as ts.TypeReference).map((t, i) => genValidator(transformer, t, i, undefined, parent))
        );
    else if (transformer.checker.isArrayType(type))
        return new Validator(type, name, {kind: TypeDataKinds.Array}, exp, parent, parent => [
            genValidator(transformer, transformer.checker.getTypeArguments(type as ts.TypeReference)[0], "", undefined, parent)
        ]);
    else if (type.symbol && hasBit(type.symbol, ts.SymbolFlags.FunctionScopedVariable) && hasBit(type.symbol, ts.SymbolFlags.Interface) && type.symbol.valueDeclaration) {
        const innerSym = transformer.checker.getTypeOfSymbolAtLocation(type.symbol, type.symbol.valueDeclaration).symbol;
        if (innerSym.members && innerSym.members.has("__new" as ts.__String)) return new Validator(type, name, {kind: TypeDataKinds.Class}, exp, parent);
        else return;
    } else if (type.getCallSignatures().length === 1) return new Validator(type, name, {kind: TypeDataKinds.Function}, exp, parent);
    else {
        if (type.isUnion()) return createUnionValidator(type, type.types, transformer, name, exp, parent);
        else if (type.getProperty("__$transform")) {
            const expressions: CodeReference[] = [];
            let rest: Validator | undefined;
            let postChecks: Validator | undefined;

            const resolveTransform = (nullableType: ts.Type, processBase: boolean) => {
                const type = transformer.checker.getNonNullableType(nullableType);
                if (transformer.checker.isTupleType(type)) {
                    for (const value of transformer.checker.getTypeArguments(type as ts.TypeReference)) {
                        const codePoint = getCodeReference(value);
                        if (codePoint) expressions.push(codePoint);
                    }
                } else {
                    const codePoint = getCodeReference(type);
                    if (codePoint) expressions.push(codePoint);
                }
                if (processBase) {
                    const baseType = type.aliasTypeArguments?.[1];
                    if (baseType) rest = genValidator(transformer, baseType, name, exp, parent);
                }
            };

            if (type.isIntersection()) {
                const otherTypes = [];
                for (const inner of type.types) {
                    if (inner.getProperty("__$transformations")) {
                        const transformations = transformer.checker.getTypeOfSymbol(inner.getProperty("__$transformations") as ts.Symbol);
                        resolveTransform(transformations, true);
                    } else if (inner.getProperty("__$post")) {
                        postChecks = genValidator(transformer, transformer.checker.getNonNullableType(transformer.checker.getTypeOfSymbol(inner.getProperty("__$post")!)), name, exp, parent);
                    } else {
                        otherTypes.push(inner);
                    }
                }
                if (otherTypes.length === 1) rest = genValidator(transformer, otherTypes[0], name, exp, parent);
                else rest = createPossibleIntersectionCheckType(type, otherTypes, transformer, name, exp, parent);
            } else {
                const transformations = transformer.checker.getTypeOfSymbol(type.getProperty("__$transformations") as ts.Symbol);
                resolveTransform(transformations, true);
            }

            return new Validator(type, name, {kind: TypeDataKinds.Transform, transformations: expressions, rest, postChecks}, exp, parent);
        }
        // Check has precedence over other utility types
        else if (type.getProperty("__$check")) {
            if (type.isIntersection()) {
                return createPossibleIntersectionCheckType(type, type.types, transformer, name, exp, parent);
            } else {
                const typeWithMapper = type as ts.Type & {mapper: ts.TypeMapper};
                let check,
                    hint: CheckTypeHint | undefined = undefined;
                if (typeWithMapper.mapper) {
                    if (typeWithMapper.mapper.kind === ts.TypeMapKind.Simple && typeWithMapper.mapper.target.isStringLiteral()) check = typeWithMapper.mapper.target.value;
                    else {
                        const exp = resolveCheck(typeWithMapper, 0);
                        if (!exp) return;
                        check = exp;
                        hint = {
                            error: getMappedType(typeWithMapper, 1) as string | undefined,
                            name: getMappedType(typeWithMapper, 2) as string | undefined,
                            value: getMappedType(typeWithMapper, 3)
                        };
                    }
                }
                if (!check) return;
                return new Validator(type, name, {kind: TypeDataKinds.Check, alternatives: [], expressions: [check], hints: hint ? [hint] : [], altHints: []}, exp, parent);
            }
        }
        const utility = transformer.getPropType(type, "name");
        if (!utility || !utility.isStringLiteral()) {
            const properties = (parent: Validator) =>
                type.getProperties().map(sym => {
                    const typeOfProp = (transformer.checker.getTypeOfSymbol(sym) || transformer.checker.getNullType()) as ts.Type;
                    return genValidator(transformer, typeOfProp, sym.name, undefined, parent);
                });
            const objValidator = new Validator(type, name, {kind: TypeDataKinds.Object}, exp, parent, properties);
            for (const info of ((type as ts.ObjectType).indexInfos as ts.IndexInfo[]) || []) {
                const keyType = genValidator(transformer, info.keyType, "", undefined, objValidator);
                if (!keyType) continue;
                const valueType = genValidator(transformer, info.type, "", undefined, objValidator);
                if (valueType) {
                    if (keyType.getBaseType() === TypeDataKinds.String) (objValidator.typeData as ObjectTypeData).stringIndexInfo = [keyType, valueType];
                    else if (keyType.getBaseType() === TypeDataKinds.Number) (objValidator.typeData as ObjectTypeData).numberIndexInfo = [keyType, valueType];
                }
            }
            return objValidator;
        } else {
            switch (utility.value) {
                case "NoCheck":
                    return;
                case "Null":
                    return new Validator(type, name, {kind: TypeDataKinds.Null}, exp, parent);
                case "Undefined":
                    return new Validator(type, name, {kind: TypeDataKinds.Undefined}, exp, parent);
                case "ExactProps": {
                    const obj = genValidator(transformer, transformer.getPropType(type, "type"), name, exp, parent);
                    if (!obj || obj.typeData.kind !== TypeDataKinds.Object) return;
                    obj.typeData.exact = isTrueType(transformer.getPropType(type, "removeExcessive")) ? ObjectTypeDataExactOptions.RemoveExtra : ObjectTypeDataExactOptions.RaiseError;
                    obj.typeData.useDeleteOperator = isTrueType(transformer.getPropType(type, "useDeleteOprerator"));
                    return obj;
                }
                case "Infer": {
                    const typeParam = type.aliasTypeArguments?.[0];
                    if (!typeParam || !typeParam.isTypeParameter()) return;
                    const callSig = getCallSigFromType(transformer.checker, typeParam);
                    if (!callSig || !callSig.instantiations) return;
                    const possibleTypes: Validator[] = [];
                    callSig.instantiations.forEach(sig => {
                        const [resolvedType] = getResolvedTypesFromCallSig(transformer.checker, [typeParam], sig);
                        if (!resolvedType) return;
                        const validator = genValidator(transformer, resolvedType, "", exp, parent);
                        if (!validator) return;
                        possibleTypes.push(validator);
                    });
                    if (!possibleTypes.length) return;
                    else if (possibleTypes.length === 1) {
                        const t = possibleTypes[0] as Validator;
                        return new Validator(t._original, name, t.typeData, exp, parent, t.children);
                    } else return new Validator(type, name, {kind: TypeDataKinds.Union}, exp, parent, possibleTypes);
                }
                case "Resolve": {
                    const typeParam = type.aliasTypeArguments?.[0];
                    if (!typeParam || !typeParam.isTypeParameter() || (typeParam.symbol.parent && hasBit(typeParam.symbol.parent, ts.SymbolFlags.Class))) return;
                    return new Validator(type, name, {kind: TypeDataKinds.Resolve, type: typeParam}, exp, parent);
                }
                default:
                    return;
            }
        }
    }
}

export function getCodeReference(type: ts.Type): CodeReference | undefined {
    if (type.isStringLiteral()) return type.value;
    else if (type.symbol) {
        if (type.symbol.name === "__function") {
            const parentDecl = type.symbol.declarations?.[0]?.parent;
            if (!parentDecl) return;
            return (parentDecl as {symbol?: ts.Symbol}).symbol;
        }
        return type.symbol;
    } else return undefined;
}

export function createPossibleIntersectionCheckType(
    originalType: ts.Type,
    types: ts.Type[],
    transformer: Transformer,
    name: ValidatorTargetName,
    exp?: ts.Expression,
    parent?: Validator
): Validator | undefined {
    const checks: CodeReference[] = [],
        hints: CheckTypeHint[] = [];
    let firstNonCheckType: ts.Type | undefined;
    for (const innerType of types) {
        const typeWithMapper = innerType as ts.Type & {mapper: ts.TypeMapper};
        const isUtilityType = transformer.getPropType(typeWithMapper, "name");
        if (isUtilityType && isUtilityType.isStringLiteral() && !typeWithMapper.getProperty("__$check")) firstNonCheckType = typeWithMapper;
        else if (typeWithMapper.mapper) {
            if (typeWithMapper.mapper.kind === ts.TypeMapKind.Simple) {
                const ref = getCodeReference(typeWithMapper.mapper.target);
                if (ref) checks.push(ref);
            } else {
                const exp = resolveCheck(typeWithMapper, 0);
                if (!exp) continue;
                checks.push(exp);
                hints.push({
                    error: getMappedType(typeWithMapper, 1) as string | undefined,
                    name: getMappedType(typeWithMapper, 2) as string | undefined,
                    value: getMappedType(typeWithMapper, 3)
                });
            }
        } else if (!firstNonCheckType) firstNonCheckType = innerType;
    }
    if (!checks.length) return;
    return new Validator(
        originalType,
        name,
        {kind: TypeDataKinds.Check, expressions: checks, hints, alternatives: [], altHints: []},
        exp,
        parent,
        firstNonCheckType ? parent => [genValidator(transformer, firstNonCheckType, "", undefined, parent)] : undefined
    );
}

export function createUnionValidator(originalType: ts.Type, members: ts.Type[], transformer: Transformer, name: ValidatorTargetName, exp?: ts.Expression, parent?: Validator): Validator | undefined {
    let includesNull = false,
        hasFalse = -1,
        hasTrue = -1;
    const children = (parent: Validator) => {
        let validators = [];
        for (let i = 0; i < members.length; i++) {
            const t = members[i];
            const validator = genValidator(transformer, t, "", undefined, parent);
            if (!validator) continue;

            if (validator.typeData.kind === TypeDataKinds.Check) {
                const existing = validators.find(val => val.cmp(validator));
                if (existing) {
                    const typeData = existing.typeData as CheckTypeData;
                    typeData.alternatives.push(...validator.typeData.expressions);
                    typeData.altHints.push(...validator.typeData.hints);
                    continue;
                }
            } else if (validator.typeData.kind === TypeDataKinds.Null) includesNull = true;
            else if (validator.typeData.kind === TypeDataKinds.Object) validator.typeData.couldBeNull = includesNull;
            else if (validator.typeData.kind === TypeDataKinds.Boolean) {
                if (validator.typeData.literal === true) hasTrue = i;
                else if (validator.typeData.literal === false) hasFalse = i;
            }
            validators.push(validator);
        }

        if (hasTrue !== -1 && hasFalse !== -1) {
            validators = [
                ...validators.filter((_, ind) => ind !== hasTrue && ind !== hasFalse),
                new Validator(transformer.checker.getBooleanType(), "", {kind: TypeDataKinds.Boolean}, undefined, parent)
            ];
        }

        return validators;
    };
    return new Validator(originalType, name, {kind: TypeDataKinds.Union}, exp, parent, children);
}

export function resolveCheck(type: ts.Type, index: number): CodeReference | undefined {
    const mappedVal = getMappedRawType(type, index);
    if (!mappedVal) return;
    return getCodeReference(mappedVal);
}

export function getMappedRawType(type: ts.Type, index: number): ts.Type | undefined {
    if (!("mapper" in type)) return;
    const typeMapper = (type as ts.Type & {mapper: ts.TypeMapper}).mapper;
    let mappedType;
    if (typeMapper.kind === ts.TypeMapKind.Simple) mappedType = typeMapper.target;
    else if (typeMapper.kind === ts.TypeMapKind.Array && typeMapper.targets) mappedType = typeMapper.targets[index];

    if (!mappedType) return;
    if (mappedType.isUnion()) return mappedType.types[mappedType.types.length - 1];
    return mappedType;
}

export function getMappedType(type: ts.Type, index: number): string | number | undefined {
    const rawType = getMappedRawType(type, index);
    if (!rawType || !rawType.isLiteral()) return;
    return rawType.value as string | number;
}
