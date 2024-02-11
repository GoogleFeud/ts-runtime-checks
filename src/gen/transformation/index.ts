import ts from "typescript";
import { TypeDataKinds, Validator } from "../validators";
import { _access, _assign, _call, _for, _ident, _stmt } from "../expressionUtils";


export interface TransformContext {
    handleRequestSymbolValue: (sym: ts.Symbol) => ts.Identifier | undefined
}

export function genTransformation(validator: Validator, target: ts.Expression, ctx: TransformContext) : ts.Statement[] {
    switch (validator.typeData.kind) {
    case TypeDataKinds.BigInt:
    case TypeDataKinds.Boolean:
    case TypeDataKinds.Class:
    case TypeDataKinds.Function:
    case TypeDataKinds.Null:
    case TypeDataKinds.Number:
    case TypeDataKinds.Recursive:
    case TypeDataKinds.Resolve:
    case TypeDataKinds.Symbol:
    case TypeDataKinds.Undefined:
    case TypeDataKinds.String:
    case TypeDataKinds.Union:
        return [_stmt(_assign(target, validator.expression()))];
    case TypeDataKinds.Array: {
        const childType = validator.children[0];
        if (!childType) return [_stmt(_assign(target, validator.expression()))];
        let index: ts.Identifier;
        if (typeof childType.name === "object") index = childType.name;
        else {
            index = _ident("i");
            childType.setName(index);
        }
        return [
            _for(validator.expression(), index, genTransformation(childType, _access(target, index), ctx))[0]
        ];
    }
    case TypeDataKinds.Tuple: {
        const transformations = [];
        for (const child of validator.children) {
            transformations.push(...genTransformation(child, _access(target, child.name), ctx));
        }
        return transformations;
    }
    case TypeDataKinds.Check: {
        if (!validator.children[0]) return [_stmt(_assign(target, validator.expression()))];
        return genTransformation(validator.children[0], target, ctx);
    }
    case TypeDataKinds.Object: {
        const transformations = [];
        for (const child of validator.children) {
            transformations.push(...genTransformation(child, _access(target, child.name), ctx));
        }
        return transformations;
    }
    case TypeDataKinds.Transformation: {
        let exp = validator.expression();
        for (const transformer of validator.typeData.transformers) {
            const identifier = ctx.handleRequestSymbolValue(transformer);
            if (identifier) exp = _call(identifier, [exp]);
        }
        return [_stmt(_assign(target, exp))];
    }
    }
}