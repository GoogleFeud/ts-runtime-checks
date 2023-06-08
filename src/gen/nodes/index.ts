import ts from "typescript";
import { NumberTypes, TypeDataKinds, Validator } from "../validators";
import { MESSAGES, concat, joinElements } from "./messages";
import { _bin, _bin_chain, _new, _num, _throw, _typeof_cmp } from "./utils";

export interface ValidationResultType {
    throw?: boolean,
    return?: ts.Expression,
    returnErr?: boolean,
    custom?: (msg: ts.Expression) => ts.Statement
}

export interface NodeGenContext {
    errorTypeName: string,
    resultType: ValidationResultType
}

export interface GenResult {
    condition: ts.Expression,
    error: ts.Expression,
    extra?: ts.Statement[]
}

export function emptyGenResult() : GenResult {
    return {
        condition: ts.factory.createNull(),
        error: ts.factory.createNull()
    };
}

export function error(ctx: NodeGenContext, errorMsg: ts.Expression) : ts.Statement {
    if (ctx.resultType.return) return ts.factory.createReturnStatement(ctx.resultType.return);
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(errorMsg);
    else if (ctx.resultType.custom) return ctx.resultType.custom(errorMsg);
    else return _throw(_new(ctx.errorTypeName, [errorMsg]));
}

export function genNode(validator: Validator) : GenResult {
    switch (validator.typeData.kind) {
    case TypeDataKinds.Number: {
        if (validator.typeData.literal) return {
            condition: _bin(validator.expression, _num(validator.typeData.literal), ts.SyntaxKind.EqualsEqualsEqualsToken),
            error: MESSAGES.ToBeEqual(validator.path(), validator.typeData.literal.toString())
        };
        const errorMessages = [];
        const checks: ts.Expression[] = [_typeof_cmp(validator.expression, "number")];
        if (validator.typeData.type === NumberTypes.Integer) {
            checks.push(_bin(_bin(validator.expression, _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.ExclamationEqualsEqualsToken));
            errorMessages.push("to be an integer");
        }
        else if (validator.typeData.type === NumberTypes.Float) {
            checks.push(_bin(_bin(validator.expression, _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.EqualsEqualsEqualsToken));
            errorMessages.push(" to be a float");
        } else {
            errorMessages.push("to be a number");
        }

        if (validator.typeData.min !== undefined) {
            checks.push(_bin(validator.expression, validator.typeData.min, ts.SyntaxKind.GreaterThanToken));
            errorMessages.push(concat`to be greater than ${validator.typeData.min}`);
        }

        if (validator.typeData.max !== undefined) {
            checks.push(_bin(validator.expression, validator.typeData.max, ts.SyntaxKind.LessThanToken));
            errorMessages.push(concat`to be less than ${validator.typeData.max}`);
        }

        return {
            condition: _bin_chain(checks, ts.SyntaxKind.AmpersandAmpersandToken),
            error: joinElements(errorMessages)
        }
    }
    default: return emptyGenResult();
    }
}
