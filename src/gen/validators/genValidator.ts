import ts from "typescript";
import { NumberTypes, TypeDataKinds, Validator, ValidatorTargetName } from "./validator";
import { getObjectFromType, getStringFromType, getTypeArg, hasBit, isTrueType } from "../../utils";
import { Transformer } from "../../transformer";

export function genValidator(transformer: Transformer, type: ts.Type | undefined, name: ValidatorTargetName, exp?: ts.Expression, parent?: Validator) : Validator | undefined {
    if (!type) return;
    if (type.isStringLiteral()) return new Validator(type, name, { kind: TypeDataKinds.String, literal: type.value}, exp, parent);
    else if (type.isNumberLiteral()) return new Validator(type, name, { kind: TypeDataKinds.Number, literal: type.value }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.String)) return new Validator(type, name, { kind: TypeDataKinds.String }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.BigInt)) return new Validator(type, name, { kind: TypeDataKinds.BigInt }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Number)) return new Validator(type, name, { kind: TypeDataKinds.Number }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Boolean)) return new Validator(type, name, { kind: TypeDataKinds.Boolean }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.ESSymbol)) return new Validator(type, name, { kind: TypeDataKinds.Symbol }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Null)) return new Validator(type, name, { kind: TypeDataKinds.Null }, exp, parent);
    else if (hasBit(type, ts.TypeFlags.Undefined)) return new Validator(type, name, { kind: TypeDataKinds.Undefined }, exp, parent);
    else if (type.getCallSignatures().length === 1) return new Validator(type, name, { kind: TypeDataKinds.Function }, exp, parent);
    else if (type.isClass()) return new Validator(type, name, { kind: TypeDataKinds.Class }, exp, parent);
    else if (type.isUnion()) return new Validator(type, name, { kind: TypeDataKinds.Union }, exp, parent, type.types.map(t => genValidator(transformer, t, "", exp)).filter(t => t) as Validator[]);
    else if (transformer.checker.isTupleType(type)) {
        const innerValidator = genValidator(transformer, transformer.checker.getTypeArguments(type as ts.TypeReference)[0], 0);
        return new Validator(type, name, { kind: TypeDataKinds.Tuple }, exp, parent, innerValidator ? [innerValidator] : []);
    }
    else if (transformer.checker.isArrayType(type)) {
        const validators = transformer.checker.getTypeArguments(type as ts.TypeReference).map((t, i) => genValidator(transformer, t, i)).filter(t => t) as Validator[];
        return new Validator(type, name, { kind: TypeDataKinds.Array }, exp, parent, validators);
    }
    else {
        const utility = transformer.getUtilityType(type);
        if (!utility || !utility.aliasSymbol || !utility.aliasTypeArguments) {
            const properties = type.getProperties().map(sym => {
                const typeOfProp = (transformer.checker.getTypeOfSymbol(sym) || transformer.checker.getNullType()) as ts.Type;
                return genValidator(transformer, typeOfProp, sym.name);
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
            const obj = genValidator(transformer, getTypeArg(utility, 0), name, exp, parent);
            if (!obj) return;
            const exact = isTrueType(getTypeArg(utility, 1));
            return new Validator(type, name, {
                kind: TypeDataKinds.Object,
                exact
            }, exp, parent, [obj]);
        }
        default: return undefined;
        }
    }
}
