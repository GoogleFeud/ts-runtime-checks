import ts from "typescript";
import { CheckTypeHint, ObjectTypeDataExactOptions, TypeDataKinds, Validator, ValidatorTargetName } from "./validator";
import { getCallSigFromType, getResolvedTypesFromCallSig, hasBit, isTrueType } from "../../utils";
import { Transformer } from "../../transformer";

export function genValidator(transformer: Transformer, type: ts.Type | undefined, name: ValidatorTargetName, exp?: ts.Expression, parent?: Validator) : Validator | undefined {
    if (!type) return;

    if (parent) {
        const recurive = parent.getParentWithType(type);
        if (recurive) {
            recurive.recursiveOrigins.push(type);
            return new Validator(type, name, { kind: TypeDataKinds.Recursive }, exp, parent);
        }
    }
    
    if (type.isStringLiteral()) return new Validator(type, name, { kind: TypeDataKinds.String, literal: type.value}, exp, parent);
    else if (type.isNumberLiteral()) return new Validator(type, name, { kind: TypeDataKinds.Number, literal: type.value }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.String) || hasBit(type, ts.TypeFlags.TemplateLiteral)) return new Validator(type, name, { kind: TypeDataKinds.String }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Number)) return new Validator(type, name, { kind: TypeDataKinds.Number }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.BigInt)) return new Validator(type, name, { kind: TypeDataKinds.BigInt }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Boolean)) return new Validator(type, name, { kind: TypeDataKinds.Boolean }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.ESSymbol)) return new Validator(type, name, { kind: TypeDataKinds.Symbol }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Null)) return new Validator(type, name, { kind: TypeDataKinds.Null }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Undefined)) return new Validator(type, name, { kind: TypeDataKinds.Undefined }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.BooleanLiteral)) return new Validator(type, name, { kind: TypeDataKinds.Boolean, literal: transformer.checker.typeToString(type) === "true" }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.AnyOrUnknown)) return;
    else if (type.getCallSignatures().length === 1) return new Validator(type, name, { kind: TypeDataKinds.Function }, exp, parent);
    else if (type.isClass()) return new Validator(type, name, { kind: TypeDataKinds.Class }, exp, parent);
    else if (type.isTypeParameter()) return;
    else if (transformer.checker.isTupleType(type)) return new Validator(type, name, { kind: TypeDataKinds.Tuple }, exp, parent, (parent: Validator) => transformer.checker.getTypeArguments(type as ts.TypeReference).map((t, i) => genValidator(transformer, t, i, undefined, parent)));
    else if (transformer.checker.isArrayType(type)) return new Validator(type, name, { kind: TypeDataKinds.Array }, exp, parent, (parent) => [genValidator(transformer, transformer.checker.getTypeArguments(type as ts.TypeReference)[0], "", undefined, parent)]);
    else {
        // Check has precedence over other utility types
        if (type.getProperty("__$check")) {
            if (type.isIntersection()) {
                const checks = [], hints: CheckTypeHint[] = [];
                let firstNonCheckType: ts.Type|undefined;
                for (const innerType of type.types) {
                    const typeWithMapper = innerType as (ts.Type & { mapper: ts.TypeMapper });
                    const isUtilityType = transformer.getPropType(typeWithMapper, "name");
                    if (isUtilityType && isUtilityType.isStringLiteral() && !typeWithMapper.getProperty("__$check")) firstNonCheckType = isUtilityType;
                    else if (typeWithMapper.mapper) {
                        if (typeWithMapper.mapper.kind === ts.TypeMapKind.Simple && typeWithMapper.mapper.target.isStringLiteral()) {
                            checks.push(typeWithMapper.mapper.target.value);
                            continue;
                        }
                        else {
                            const exp = getMappedType(typeWithMapper, 0);
                            if (typeof exp === "string") checks.push(exp);
                            else continue;
                            hints.push({
                                error: getMappedType(typeWithMapper, 1) as string|undefined,
                                name: getMappedType(typeWithMapper, 2) as string|undefined,
                                value: getMappedType(typeWithMapper, 3)
                            });
                        }
                    }
                    else if (!firstNonCheckType) firstNonCheckType = innerType;
                }
                return new Validator(type, name, { kind: TypeDataKinds.Check, expressions: checks, hints }, exp, parent, firstNonCheckType ? (parent) => [genValidator(transformer, firstNonCheckType, "", undefined, parent)] : undefined);
            } else {
                const typeWithMapper = type as (ts.Type & { mapper: ts.TypeMapper });
                let check, error;
                if (typeWithMapper.mapper) {
                    if (typeWithMapper.mapper.kind === ts.TypeMapKind.Simple && typeWithMapper.mapper.target.isStringLiteral()) check = typeWithMapper.mapper.target.value;
                    else {
                        const exp = getMappedType(typeWithMapper, 0);
                        if (typeof exp === "string") check = exp;
                        const errorText = getMappedType(typeWithMapper, 1);
                        if (typeof errorText === "string") error = errorText;
                    }
                }
                if (!check) return;
                return new Validator(type, name, { kind: TypeDataKinds.Check, expressions: [check], hints: [{error}]}, exp, parent);
            }
        }
        const utility = transformer.getPropType(type, "name");
        if (!utility || !utility.isStringLiteral()) {
            if (type.isUnion()) return new Validator(type, name, { kind: TypeDataKinds.Union }, exp, parent, (parent) => type.types.map(t => genValidator(transformer, t, "", undefined, parent)));
            const properties = (parent: Validator) => type.getProperties().map(sym => {
                const typeOfProp = (transformer.checker.getTypeOfSymbol(sym) || transformer.checker.getNullType()) as ts.Type;
                return genValidator(transformer, typeOfProp, sym.name, undefined, parent);
            });
            return new Validator(type, name, {
                kind: TypeDataKinds.Object,
                stringIndexType: type.getStringIndexType(),
                numberIndexType: type.getNumberIndexType()
            }, exp, parent, properties);
        }
        else {
            switch (utility.value) {
            case "NoCheck": return;
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
                callSig.instantiations.forEach((sig) => {
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
                }
                else return new Validator(type, name, { kind: TypeDataKinds.Union }, exp, parent, possibleTypes);
            }
            case "Resolve": {
                const typeParam = type.aliasTypeArguments?.[0];
                if (!typeParam || !typeParam.isTypeParameter() || (typeParam.symbol.parent && hasBit(typeParam.symbol.parent, ts.SymbolFlags.Class))) return;
                return new Validator(type, name, { 
                    kind: TypeDataKinds.Resolve,
                    type: typeParam
                }, exp, parent);
            }
            default: return;
            }
        }
    }
}

export function getMappedType(type: ts.Type & { mapper: ts.TypeMapper}, index: number) : string|number|undefined {
    if (type.mapper.kind === ts.TypeMapKind.Simple && type.mapper.target.isLiteral()) return type.mapper.target.value as string|number;
    else if (type.mapper.kind === ts.TypeMapKind.Array && type.mapper.targets) {
        let target = type.mapper.targets[index];
        if (!target) return;
        if (target.isUnion()) target = target.types[target.types.length - 1];
        if (!target || !target.isLiteral()) return;
        return target.value as string|number; 
    }
    else return;
}