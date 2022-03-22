import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genIf, genOptional, genTypeCmp } from "./codegen";
import { hasBit } from "./utils";

export function validateBaseType(t: ts.Type, target: ts.Expression) : [ts.Expression, string] | undefined {
    if (t.isStringLiteral()) return [genCmp(target, factory.createStringLiteral(t.value)), `"${t.value}"`];
    else if (t.isNumberLiteral()) return [genCmp(target, factory.createNumericLiteral(t.value)), t.value.toString()];
    else if (hasBit(t, TypeFlags.String)) return [genTypeCmp(target, "string"), "string"];
    else if (hasBit(t, TypeFlags.Number)) return [genTypeCmp(target, "number"), "number"];
    else if (hasBit(t, TypeFlags.Boolean)) return [genTypeCmp(target, "boolean"), "boolean"];
    else if (t.isClass()) return [factory.createBinaryExpression(target, ts.SyntaxKind.InstanceOfKeyword, factory.createIdentifier(t.symbol.name)), `class ${t.symbol.name}`];
    return undefined;
}

export function validate(t: ts.Type, target: ts.Expression, isOptional?: boolean, parent?: ts.Expression, name?: ts.StringLiteral) : ts.Statement | undefined {
    const res = validateBaseType(t, target);
    if (!res) return;
    const condition = isOptional ? genOptional(target, res[0], parent, name) : res[0];
    return genIf(condition, factory.createThrowStatement(factory.createNewExpression(
        factory.createIdentifier("Error"),
        undefined,
        [factory.createStringLiteral(`Expected X to be of type ${res[1]}`)]
    )));
}

