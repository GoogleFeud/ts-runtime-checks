import { genValidator, NumberTypes, TypeDataKinds, Validator } from "../validators";
import { Transformer } from "../../transformer";
import ts from "typescript";

export type JSONSchema = Record<string, unknown>;

export function validatorToJSONSchema(validator: Validator) : JSONSchema|undefined {
    switch (validator.typeData.kind) {
    case TypeDataKinds.String: return {
        type: "string",
        minLength: validator.typeData.minLen && ts.isNumericLiteral(validator.typeData.minLen) ? +validator.typeData.minLen.text : undefined,
        maxLength: validator.typeData.maxLen && ts.isNumericLiteral(validator.typeData.maxLen) ? +validator.typeData.maxLen.text : undefined,
        pattern: validator.typeData.matches && ts.isStringLiteral(validator.typeData.matches) ? +validator.typeData.matches.text : undefined
    };
    case TypeDataKinds.Number: return {
        type: validator.typeData.type === NumberTypes.Integer ? "integer" : "number",
        minimum: validator.typeData.min && ts.isNumericLiteral(validator.typeData.min) ? +validator.typeData.min.text : undefined,
        maximum: validator.typeData.max && ts.isNumericLiteral(validator.typeData.max) ? +validator.typeData.max.text : undefined
    };
    case TypeDataKinds.Object: {
        const properties: JSONSchema = {};
        const required = [];
        for (const child of validator.children) {
            const nonNullable = child.getNonOptionalValue(), name = child.nameToString();
            if (!nonNullable) required.push(name);
            properties[name] = validatorToJSONSchema(nonNullable || child);
        }
        return {
            type: "object",
            properties,
            required,
            additionalProperties: validator.exactProps() === undefined
        };
    }
    case TypeDataKinds.Array: return {
        type: "array",
        items: validator.children[0] ? validatorToJSONSchema(validator.children[0]) : undefined,
        minItems: validator.typeData.minLen && ts.isNumericLiteral(validator.typeData.minLen) ? +validator.typeData.minLen.text : undefined,
        maxItems: validator.typeData.maxLen && ts.isNumericLiteral(validator.typeData.maxLen) ? +validator.typeData.maxLen.text : undefined,
    };
    case TypeDataKinds.Tuple: return {
        type: "array",
        prefixItems: validator.children.map(c => validatorToJSONSchema(c))
    };
    case TypeDataKinds.Union: return {
        oneOf: validator.children.map(c => validatorToJSONSchema(c))
    };
    case TypeDataKinds.Boolean: return {
        type: "boolean"
    };
    case TypeDataKinds.Null: return {
        type: "null"
    };
    case TypeDataKinds.Recursive: return {
        $ref: "#"
    };
    case TypeDataKinds.BigInt:
    case TypeDataKinds.Class:
    case TypeDataKinds.Function:
    case TypeDataKinds.If:
    case TypeDataKinds.Resolve:
    case TypeDataKinds.Symbol:
    case TypeDataKinds.Undefined:
        return undefined;
    }
}

export function typeToJSONSchema(transformer: Transformer, type: ts.Type) : JSONSchema | undefined {
    const validator = genValidator(transformer, type, "origin");
    if (!validator) return;
    return validatorToJSONSchema(validator);
}