import { genValidator, TypeDataKinds, Validator } from "../validators";
import { Transformer } from "../../transformer";
import ts from "typescript";

export type JSONSchema = Record<string, unknown>;

export function validatorToJSONSchema(validator: Validator) : JSONSchema|undefined {
    switch (validator.typeData.kind) {
    case TypeDataKinds.String: return {
        type: "string"
    };
    case TypeDataKinds.Number: return {
        type: "number"
    };
    case TypeDataKinds.Check: {
        if (!validator.children.length) return;
        const childType = validator.children[0] as Validator;
        const base = validatorToJSONSchema(childType);
        if (!base) return;
        for (const hint of validator.typeData.hints) {
            if (hint.name === "int") base.type = "integer";
            else if (hint.name === "min") base.minimum = hint.value;
            else if (hint.name === "max") base.maximum = hint.value;
            else if (hint.name === "minLen") {
                if (childType.typeData.kind === TypeDataKinds.Array) base.minItems = hint.value; 
                else base.minLength = hint.value;
            }
            else if (hint.name === "maxLen") {
                if (childType.typeData.kind === TypeDataKinds.Array) base.maxItems = hint.value; 
                else base.maxLength = hint.value;
            }
            else if (hint.name === "matches") base.pattern = hint.value;
        }
        return base;
    }
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
        items: validator.children[0] ? validatorToJSONSchema(validator.children[0]) : undefined
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
    case TypeDataKinds.Resolve:
    case TypeDataKinds.Symbol:
    case TypeDataKinds.Undefined:
    case TypeDataKinds.Transformation:
        return undefined;
    }
}

export function typeToJSONSchema(transformer: Transformer, type: ts.Type) : JSONSchema | undefined {
    const validator = genValidator(transformer, type, "origin");
    if (!validator) return;
    return validatorToJSONSchema(validator);
}