/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-cond-assign */
import ts, { TypeFlags, factory } from "typescript";
import { genCmp, genForLoop, genIdentifier, genIf, genInstanceof, genNew, genNot, genOptional, genThrow, genTypeCmp, UNDEFINED } from "./codegen";
import { hasBit } from "./utils";

export interface ValidationParent {
    parent?: ts.Expression,
    parentStr?: string,
    propName: string
}

export type ValidationResultType = {
    throw?: boolean,
    return?: ts.Expression
}

export class ValidationContext {
    errorTypeName: string;
    checker: ts.TypeChecker;
    depth: Array<ValidationParent>;
    resultType: ValidationResultType;
    arrayInd?: ts.Identifier;
    constructor(ctx: {
        errorTypeName?: string,
        checker: ts.TypeChecker,
        depth: Array<ValidationParent>,
        propName: string,
        resultType?: ValidationResultType
    }) {
        this.checker = ctx.checker;
        this.errorTypeName = ctx.errorTypeName || "Error";
        this.depth = ctx.depth;
        this.resultType = ctx.resultType || { throw: true };
        this.depth.push({ propName: ctx.propName });
    }

    error(t: ts.Type) : ts.Statement {
        if (this.resultType.return) return factory.createReturnStatement(this.resultType.return);
        const parent = this.depth[this.depth.length - 1]!;
        const location = parent.parentStr ? `${parent.parentStr}.${parent.propName}` : parent.propName;
        if (this.arrayInd) return genThrow(genNew(this.errorTypeName, [
            factory.createBinaryExpression(
                factory.createBinaryExpression(factory.createStringLiteral(`Expected ${location}[`), factory.createToken(ts.SyntaxKind.PlusToken), this.arrayInd),
                factory.createToken(ts.SyntaxKind.PlusToken),
                factory.createStringLiteral(`] to be ${this.checker.typeToString(t)}.`)
            )
        ]));
        else return genThrow(genNew(this.errorTypeName, `Expected ${location} to be ${this.checker.typeToString(t)}.`));
    }

    addParent(parent: ts.Expression, prop: string) : void {
        const lastParent = this.depth[this.depth.length - 1];
        this.depth.push({parent, parentStr: lastParent ? lastParent.parentStr + lastParent.propName : "", propName: prop});
    }

    genOptional(a: ts.Expression, b: ts.Expression) : ts.Expression {
        const lastParent = this.depth[this.depth.length - 1]!;
        return genOptional(a, b, lastParent.parent, lastParent.propName);
    }

}

export function validateBaseType(t: ts.Type, target: ts.Expression) : ts.Expression | undefined {
    if (t.isStringLiteral()) return genCmp(target, factory.createStringLiteral(t.value));
    else if (t.isNumberLiteral()) return genCmp(target, factory.createNumericLiteral(t.value));
    else if (hasBit(t, TypeFlags.String)) return genTypeCmp(target, "string");
    else if (hasBit(t, TypeFlags.Number)) return genTypeCmp(target, "number");
    else if (hasBit(t, TypeFlags.Boolean)) return genTypeCmp(target, "boolean");
    else if (t.isClass()) return genInstanceof(target, t.symbol.name);
    return undefined;
}

export function validateType(t: ts.Type, target: ts.Expression, ctx: ValidationContext, isOptional?: boolean) : Array<ts.Statement> {
    const result = [];
    let type;
    if (type = isArrayType(ctx.checker, t)) {
        const typeCheck = genIf(
            genNot(genInstanceof(target, "Array")),
            ctx.error(t)
        );
        const index = factory.createUniqueName("i");
        const [Xdefinition, x] = genIdentifier("x", factory.createElementAccessExpression(target, index), ts.NodeFlags.Const);
        ctx.arrayInd = index;
        const validationOfChildren = validateType(type, x, ctx);
        delete ctx.arrayInd;
        const loop = genForLoop(
            target, index,
            [
                Xdefinition,
                ...validationOfChildren
            ]
        )[0];
        if (isOptional) result.push(genIf(genCmp(target, UNDEFINED), [typeCheck, loop]));
        else result.push(typeCheck, loop);
    } else {
        if (type = validateBaseType(t, target)) {
            const condition = isOptional ? ctx.genOptional(target, type) : type;
            result.push(genIf(condition, ctx.error(t)));
        }
    }
    return result;
}

export function isArrayType(checker: ts.TypeChecker, t: ts.Type) : ts.Type|undefined {
    const node = checker.typeToTypeNode(t, undefined, undefined);
    if (!node) return;
    if (node.kind === ts.SyntaxKind.ArrayType) return checker.getTypeArguments(t as ts.TypeReference)[0];
    return;
}