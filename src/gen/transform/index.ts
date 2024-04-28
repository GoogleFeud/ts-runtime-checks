import {Transformer} from "../../transformer";
import {genCheckCtx} from "../../utils";
import {_access, _assign, _call, _ident, _stmt, _var} from "../expressionUtils";
import {TypeDataKinds, Validator} from "../validators";
import ts from "typescript";

export interface TransformCtx {
    transformer: Transformer;
    origin: ts.Node;
    target: ts.Expression;
}

export function genTransform(validator: Validator, ctx: TransformCtx): ts.Statement[] {
    switch (validator.typeData.kind) {
        case TypeDataKinds.Transform: {
            if (!validator.typeData.transformations) return [_stmt(ts.factory.createNull())];
            const prevStmts = [];
            let previousExp = validator.expression();
            for (let i = 0; i < validator.typeData.transformations.length; i++) {
                const code = validator.typeData.transformations[i] as string | ts.Symbol;
                if (typeof code === "string") {
                    if (i !== 0) {
                        const ident = _ident("temp");
                        const exp = ctx.transformer.stringToNode(code, genCheckCtx(ident));
                        prevStmts.push(_var(ident, previousExp, ts.NodeFlags.Const)[0]);
                        previousExp = exp;
                    } else {
                        previousExp = ctx.transformer.stringToNode(code, genCheckCtx(previousExp));
                    }
                } else {
                    const funcIdent = ctx.transformer.importSymbol(code, ctx.origin);
                    if (!funcIdent) continue;
                    previousExp = _call(funcIdent, [previousExp]);
                }
            }
            return [...prevStmts, _stmt(_assign(_access(ctx.target, validator.name), previousExp))];
        }
        default:
            return [_stmt(_assign(_access(ctx.target, validator.name), validator.expression()))];
    }
}
