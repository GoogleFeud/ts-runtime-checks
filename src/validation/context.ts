/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts, { factory } from "typescript";
import { genAdd, genCmp, genNew, genOptional, genStr, genThrow, UNDEFINED } from "./codegen";

export interface ValidationPath {
    parent?: ts.Expression,
    propName: string | ts.Expression
}

export type ValidationResultType = {
    throw?: boolean,
    return?: ts.Expression
}

/**
 * Helper class which handles most data used by the validator.
 */
export class ValidationContext {
    errorTypeName: string;
    checker: ts.TypeChecker;
    depth: Array<ValidationPath>;
    resultType: ValidationResultType;
    constructor(ctx: {
        errorTypeName?: string,
        checker: ts.TypeChecker,
        depth: Array<ValidationPath>,
        propName: string,
        resultType?: ValidationResultType
    }) {
        this.checker = ctx.checker;
        this.errorTypeName = ctx.errorTypeName || "Error";
        this.depth = ctx.depth;
        this.resultType = ctx.resultType || { throw: true };
        this.depth.push({ propName: ctx.propName });
    }

    /**
     * Generates a useful error from the provided type. Takes the [[depth]], [[resultType]] and [[errorTypeName]] into account.
     */
    error(t: ts.Type) : ts.Statement {
        if (this.resultType.return) return factory.createReturnStatement(this.resultType.return);
        const errPath = this.visualizeDepth();
        if (typeof errPath === "string") return genThrow(genNew(this.errorTypeName, `Expected ${errPath} to be ${this.checker.typeToString(t)}.`));
        else return genThrow(genNew(this.errorTypeName, [
            genAdd(genAdd(genStr("Expected "), errPath), genStr(` to be ${this.checker.typeToString(t)}.`))
        ]));
    }

    addPath(parent: ts.Expression, propName: string | ts.Expression) : void {
        this.depth.push({ parent, propName });
    }

    removePath() : void {
        this.depth.pop();
    }

    /**
     * Utility function which wraps around the ohter `genOptional` utility method, but this takes the last path into consideration.
     */
    genOptional(a: ts.Expression, b: ts.Expression) : ts.Expression {
        const lastParent = this.depth[this.depth.length - 1]!;
        return genOptional(a, b, lastParent.parent, typeof lastParent.propName === "string" ? lastParent.propName : undefined);
    }

    /**
     * Utility type which checks if `a` exists either by comparing it to undefined, or checking if it's inside the parent.
     */
    exists(a: ts.Expression) : ts.Expression {
        const lastParent = this.depth[this.depth.length - 1]!;
        return lastParent.parent && typeof lastParent.propName === "string" ? factory.createBinaryExpression(
            genStr(lastParent.propName),
            ts.SyntaxKind.InKeyword,
            lastParent.parent
        ) : genCmp(a, UNDEFINED);
    }

    /**
     * @returns The [[depth]] as a string, or an Expression if any of the paths contains an expression.
     */
    visualizeDepth() : string | ts.Expression {
        const resStr = [];
        let res;
        for (const depth of this.depth) {
            if (typeof depth.propName === "string") resStr.push(depth.propName);
            else {
                if (res) {
                    if (resStr.length) {
                        res = genAdd(genAdd(res, genStr(`]${resStr.join(".")}[`)), depth.propName);
                        resStr.length = 0;
                    }
                    else res = genAdd(genAdd(res, genStr("][")), depth.propName);
                } else {
                    if (resStr.length) {
                        res = genAdd(genStr(`${resStr.join(".")}[`), depth.propName);
                        resStr.length = 0;
                    }
                    else res = depth.propName;
                }
            }
        }
        if (res) {
            if (resStr.length) return genAdd(res, genStr(`]${resStr.join(".")}`));
            else return genAdd(res, genStr("]"));
        } else return resStr.join(".");
    }

}