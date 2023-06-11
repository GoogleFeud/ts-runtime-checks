import ts from "typescript";
import { NumberTypes, TypeDataKinds, Validator } from "../validators";
import { MESSAGES, concat, joinElements } from "./messages";
import { _bin, _bin_chain, _if, _new, _num, _or, _throw, _typeof_cmp, BlockLike } from "./utils";

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
    error?: ts.Statement,
    ifTrue?: BlockLike,
    ifFalse?: BlockLike,
    extra?: ts.Statement[]
}

export function emptyGenResult() : GenResult {
    return {
        condition: ts.factory.createNull()
    };
}

export function error(ctx: NodeGenContext, validator: Validator, errorMsg: ts.Expression[]) : ts.Statement {
    const finalMsg = _bin_chain(joinElements([`Expected ${validator.path()} `, ...errorMsg]), ts.SyntaxKind.PlusToken);
    if (ctx.resultType.return) return ts.factory.createReturnStatement(ctx.resultType.return);
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(finalMsg);
    else if (ctx.resultType.custom) return ctx.resultType.custom(finalMsg);
    else return _throw(_new(ctx.errorTypeName, [finalMsg]));
}

export function genNode(validator: Validator, ctx: NodeGenContext) : GenResult {
    switch (validator.typeData.kind) {
    case TypeDataKinds.Number: {
        if (validator.typeData.literal) return {
            condition: _bin(validator.expression, _num(validator.typeData.literal), ts.SyntaxKind.EqualsEqualsEqualsToken),
            error: error(ctx, validator, MESSAGES.ToBeEqual(validator.path(), validator.typeData.literal.toString()))
        };
        const errorMessages = [];
        const checks: ts.Expression[] = [_typeof_cmp(validator.expression, "number", ts.SyntaxKind.ExclamationEqualsEqualsToken)];
        if (validator.typeData.type === NumberTypes.Integer) {
            checks.push(_bin(_bin(validator.expression, _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.ExclamationEqualsEqualsToken));
            errorMessages.push("to be an integer");
        }
        else if (validator.typeData.type === NumberTypes.Float) {
            checks.push(_bin(_bin(validator.expression, _num(1), ts.SyntaxKind.PercentToken), _num(0), ts.SyntaxKind.EqualsEqualsEqualsToken));
            errorMessages.push("to be a float");
        } else {
            errorMessages.push("to be a number");
        }

        if (validator.typeData.min !== undefined) {
            checks.push(_bin(validator.expression, validator.typeData.min, ts.SyntaxKind.LessThanToken));
            errorMessages.push(...concat`to be greater than ${validator.typeData.min}`);
        }

        if (validator.typeData.max !== undefined) {
            checks.push(_bin(validator.expression, validator.typeData.max, ts.SyntaxKind.GreaterThanToken));
            errorMessages.push(...concat`to be less than ${validator.typeData.max}`);
        }

        return {
            condition: _or(...checks),
            error: error(ctx, validator, joinElements(errorMessages, ", "))
        };
    }
    default: return emptyGenResult();
    }
}

export function generateStatements(results: GenResult[]) : ts.Statement[] {
    const result = [];
    for (const genResult of results) {
        result.push(_if(genResult.condition, (genResult.error ? genResult.error : genResult.ifTrue) as BlockLike, genResult.ifFalse));
        if (genResult.extra) result.push(...genResult.extra);
    }
    return result;
}

export function validateType(validator: Validator, ctx: NodeGenContext) : ts.Statement[] {
    return generateStatements([genNode(validator, ctx)]);
}