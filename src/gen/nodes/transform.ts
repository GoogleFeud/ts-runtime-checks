import {createContext} from ".";
import {Transformer} from "../../transformer";
import {genCheckCtx} from "../../utils";
import {getUnionMembers} from "../../utils/unions";
import {_access, _assign, _call, _for, _ident, _if_chain, _obj, _stmt, _var} from "../expressionUtils";
import {TransformTypeData, TypeDataKinds, Validator} from "../validators";
import ts from "typescript";
import {genConciseNode} from "./match";

export interface TransformCtx {
    transformer: Transformer;
    origin: ts.Node;
}

export function genTransform(validator: Validator, target: ts.Expression, ctx: TransformCtx): ts.Statement[] {
    const assignTarget = validator.parent && validator.name !== "" ? _access(target, validator.name) : target;

    switch (validator.typeData.kind) {
        case TypeDataKinds.Transform: {
            if (!validator.typeData.transformations.length) return [];
            const prevStmts: ts.Statement[] = [];
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
            return [...prevStmts, _stmt(_assign(assignTarget, previousExp))];
        }
        case TypeDataKinds.Tuple:
        case TypeDataKinds.Object: {
            const initializer = validator.typeData.kind === TypeDataKinds.Tuple ? ts.factory.createArrayLiteralExpression() : _obj({});
            return [_stmt(_assign(assignTarget, initializer)), ...validator.children.map(child => genTransform(child, assignTarget, ctx)).flat()];
        }
        case TypeDataKinds.Array: {
            const childType = validator.children[0];
            if (!childType) return [_stmt(_assign(assignTarget, validator.expression()))];
            let index: ts.Identifier;
            if (typeof childType.name === "object") index = childType.name;
            else {
                index = _ident("i");
                childType.setName(index);
            }
            return [_stmt(_assign(assignTarget, ts.factory.createArrayLiteralExpression())), _for(validator.expression(), index, genTransform(childType, assignTarget, ctx))[0]];
        }
        case TypeDataKinds.Union: {
            const transforms = validator.getChildrenOfKind(TypeDataKinds.Transform);
            if (!transforms.length) return [_stmt(_assign(assignTarget, validator.expression()))];
            const transformBases = transforms.map(transform => (transform.typeData as TransformTypeData).rest).filter(i => i) as Validator[];

            const {normal, compound} = getUnionMembers(transformBases);

            const nodeCtx = createContext(ctx.transformer, {none: true}, ctx.origin);

            return [
                _if_chain(
                    0,
                    [...normal, ...compound].map(validator => {
                        const check = genConciseNode(validator, nodeCtx);
                        const originalTransform = transforms[transformBases.indexOf(validator)] as Validator;

                        return [check.condition, genTransform(originalTransform, assignTarget, ctx)];
                    })
                ) as ts.Statement
            ];
        }
        default:
            return [_stmt(_assign(assignTarget, validator.expression()))];
    }
}
