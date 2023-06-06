import ts from "typescript";
import { TypeDataKinds, Validator } from "../validators";
import { MESSAGES } from "./messages";
import { _bin, _if, _new, _num, _throw } from "./utils";

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

export function error(ctx: NodeGenContext, msg: keyof typeof MESSAGES, ...params: Array<Validator|string>) : ts.Statement {
    if (ctx.resultType.return) return ts.factory.createReturnStatement(ctx.resultType.return);
    //@ts-expect-error Expected
    const errorMsg = ts.factory.createStringLiteral(MESSAGES[msg](...params.map(p => p.toString())));
    if (ctx.resultType.returnErr) return ts.factory.createReturnStatement(errorMsg);
    else if (ctx.resultType.custom) return ctx.resultType.custom(errorMsg);
    else return _throw(_new(ctx.errorTypeName, [errorMsg]));
}

export function genNode(validator: Validator, ctx: NodeGenContext) : ts.Statement[] {
    switch (validator.typeData.kind) {
    case TypeDataKinds.Number: {
        if (validator.typeData.literal) return _if(_bin(validator.expression, _num(validator.typeData.literal), ts.SyntaxKind.EqualsEqualsEqualsToken), )
        return [];
    }
    default: return [];
    }
}

