import ts from "typescript";
import { NumberTypes, ObjectTypeDataExactOptions, TypeDataKinds, Validator, ValidatorTargetName } from "./validator";
import { getCallSigFromType, getObjectFromType, getResolvedTypesFromCallSig, getStringFromType, getTypeArg, hasBit, isTrueType, parseJsDocTags } from "../../utils";
import { Transformer } from "../../transformer";

export function genValidator(transformer: Transformer, type: ts.Type | undefined, name: ValidatorTargetName, exp?: ts.Expression, parent?: Validator, tags?: readonly ts.JSDocTag[]) : Validator | undefined {
    if (!type) return;
    if (type.isStringLiteral()) return new Validator(type, name, { kind: TypeDataKinds.String, literal: type.value}, exp, parent);
    else if (type.isNumberLiteral()) return new Validator(type, name, { kind: TypeDataKinds.Number, literal: type.value }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.String) || hasBit(type, ts.TypeFlags.TemplateLiteral)) return new Validator(type, name, { kind: TypeDataKinds.String, ...(tags ? parseJsDocTags(transformer, tags, ["minLen", "maxLen", "length", "matches"]) : {}) }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Number)) return new Validator(type, name, { kind: TypeDataKinds.Number, ...(tags ? parseJsDocTags(transformer, tags, ["min", "max", "type"]) : {}) }, exp, parent);
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
    else if (transformer.checker.isTupleType(type)) {
        const validators = transformer.checker.getTypeArguments(type as ts.TypeReference).map((t, i) => genValidator(transformer, t, i)).filter(t => t) as Validator[];
        return new Validator(type, name, { kind: TypeDataKinds.Tuple }, exp, parent, validators);
    }
    else if (transformer.checker.isArrayType(type)) {
        const validator = genValidator(transformer, transformer.checker.getTypeArguments(type as ts.TypeReference)[0], "");
        return new Validator(type, name, { kind: TypeDataKinds.Array, ...(tags ? parseJsDocTags(transformer, tags, ["minLen", "maxLen", "length"]) : {}) }, exp, parent, validator ? [validator] : []);
    }
    else {
        const utility = transformer.getUtilityType(type);
        if (!utility || !utility.aliasSymbol || !utility.aliasTypeArguments) {
            if (type.isUnion()) return new Validator(type, name, { kind: TypeDataKinds.Union }, exp, parent, type.types.map(t => genValidator(transformer, t, "", exp)).filter(t => t) as Validator[]);
            const properties = type.getProperties().map(sym => {
                const typeOfProp = (transformer.checker.getTypeOfSymbol(sym) || transformer.checker.getNullType()) as ts.Type;
                return genValidator(transformer, typeOfProp, sym.name, undefined, undefined, sym.valueDeclaration ? ts.getJSDocTags(sym.valueDeclaration) : undefined);
            }).filter(p => p) as Validator[];
            return new Validator(type, name, { kind: TypeDataKinds.Object }, exp, parent, properties);
        }
        switch (utility.aliasSymbol.name) { 
        case "Num": {
            const settings = getObjectFromType(transformer.checker, utility, 0);
            const numType = settings.type ? transformer.typeToString(settings.type) === "float" ? NumberTypes.Float : NumberTypes.Integer : undefined;
            const min = settings.min ? transformer.typeValueToNode(settings.min) : undefined;
            const max = settings.max ? transformer.typeValueToNode(settings.max) : undefined;
            return new Validator(type, name, {
                kind: TypeDataKinds.Number,
                type: numType,
                min,
                max
            }, exp, parent);
        }
        case "Str": {
            const settings = getObjectFromType(transformer.checker, utility, 0);
            const minLen = settings.minLen ? transformer.typeValueToNode(settings.minLen) : undefined;
            const maxLen = settings.maxLen ? transformer.typeValueToNode(settings.maxLen) : undefined;
            const length = settings.length ? transformer.typeValueToNode(settings.length) : undefined;
            const matches = settings.matches ? transformer.typeValueToNode(settings.matches, true) : undefined;
            return new Validator(type, name, {
                kind: TypeDataKinds.String,
                minLen,
                maxLen,
                matches,
                length
            }, exp, parent);
        }
        case "Arr": {
            const innerType = genValidator(transformer, getTypeArg(utility, 0), 0);
            const settings = getObjectFromType(transformer.checker, utility, 1);
            const minLen = settings.minLen ? transformer.typeValueToNode(settings.minLen) : undefined;
            const maxLen = settings.maxLen ? transformer.typeValueToNode(settings.maxLen) : undefined;
            const length = settings.length ? transformer.typeValueToNode(settings.length) : undefined;
            return new Validator(type, name, {
                kind: TypeDataKinds.Array,
                minLen,
                maxLen,
                length
            }, exp, parent, innerType ? [innerType] : []);
        }
        case "NoCheck": return;
        case "If": {
            const innerType = utility.aliasTypeArguments[0];
            const stringifiedExp = getStringFromType(utility, 1);
            const fullCheck = isTrueType(utility.aliasTypeArguments[2]);
            if (!innerType || !stringifiedExp) return;
            const innerTypeValidator = genValidator(transformer, innerType, "");
            return new Validator(type, name, {
                kind: TypeDataKinds.If,
                expression: stringifiedExp,
                fullCheck,
            }, exp, parent, innerTypeValidator ? [innerTypeValidator] : undefined);
        }
        case "ExactProps": {
            const obj = genValidator(transformer, getTypeArg(utility, 0), "");
            if (!obj) return;
            const remove = isTrueType(getTypeArg(utility, 1));
            return new Validator(type, name, {
                kind: TypeDataKinds.Object,
                exact: remove ? ObjectTypeDataExactOptions.RemoveExtra : ObjectTypeDataExactOptions.RaiseError,
                useDeleteOperator: isTrueType(getTypeArg(utility, 2))
            }, exp, parent, obj.children);
        }
        case "Infer": {
            const typeParam = utility.aliasTypeArguments[0];
            if (!typeParam || !typeParam.isTypeParameter()) return;
            const callSig = getCallSigFromType(transformer.checker, typeParam);
            if (!callSig || !callSig.instantiations) return;
            const possibleTypes: Validator[] = [];
            callSig.instantiations.forEach((sig) => {
                const [resolvedType] = getResolvedTypesFromCallSig(transformer.checker, [typeParam], sig);
                if (!resolvedType) return;
                const validator = genValidator(transformer, resolvedType, "", exp, parent);
                if (!validator) return;
                const existing = possibleTypes.findIndex(v => v.typeData.kind === validator.typeData.kind);
                if (existing !== -1) possibleTypes[existing] = (possibleTypes[existing] as Validator).merge(validator);
                else possibleTypes.push(validator);
                return;
            });
            if (!possibleTypes.length) return;
            else if (possibleTypes.length === 1) {
                const t = possibleTypes[0] as Validator;
                return new Validator(t._original, name, t.typeData, exp, parent, t.children);
            }
            else return new Validator(type, name, { kind: TypeDataKinds.Union }, exp, parent, possibleTypes);
        }
        case "Resolve": {
            const typeParam = utility.aliasTypeArguments[0];
            if (!typeParam || !typeParam.isTypeParameter()) return;
            return new Validator(type, name, { 
                kind: TypeDataKinds.Resolve,
                type: typeParam
            }, exp, parent);
        }
        default: return;
        }
    }
}