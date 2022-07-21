/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts, { factory } from "typescript";
import { Transformer } from "../transformer";
import { genAdd, genCmp, genLogicalAND, genNew, genStr, genThrow, UNDEFINED } from "./utils";

export interface ValidationPath {
    parent?: ts.Expression,
    propName: string | ts.Expression,
    dotNotation?: boolean
}

export interface ValidationResultType {
    throw?: boolean,
    return?: ts.Expression,
    returnErr?: boolean
}

/**
 * Helper class which handles most data used by the validator.
 */
export class ValidationContext {
    errorTypeName: string;
    transformer: Transformer;
    depth: Array<ValidationPath>;
    resultType: ValidationResultType;
    exactProps?: boolean;
    constructor(ctx: {
        errorTypeName?: string,
        transformer: Transformer,
        depth: Array<ValidationPath>,
        propName: string | ts.Expression,
        resultType?: ValidationResultType
    }) {
        this.transformer = ctx.transformer;
        this.errorTypeName = ctx.errorTypeName || "Error";
        this.depth = ctx.depth;
        this.resultType = ctx.resultType || { throw: true };
        this.depth.push({ propName: ctx.propName });
    }

    /**
     * Generates a useful error from the provided type. Takes the [[depth]], [[resultType]] and [[errorTypeName]] into account.
     */
    error(t: ts.Type, error?: [string?, string?]) : ts.Statement {
        if (this.resultType.return) return factory.createReturnStatement(this.resultType.return);
        const errPath = this.visualizeDepth();
        const errMessage = typeof errPath === "string" ? genStr(error?.[0] || "Expected " + errPath + (error?.[1] || ` to be ${this.transformer.checker.typeToString(t)}.`)) : genAdd(genAdd(genStr(error?.[0] || "Expected "), errPath), genStr(error?.[1] || ` to be ${this.transformer.checker.typeToString(t)}.`));
        if (this.resultType.returnErr) return factory.createReturnStatement(errMessage);
        else return genThrow(genNew(this.errorTypeName, [errMessage]));
    }

    addPath(parent: ts.Expression, propName: string | ts.Expression, dotNotation?: boolean) : void {
        this.depth.push({ parent, propName, dotNotation });
    }

    removePath() : void {
        this.depth.pop();
    }


    genOptional(a: ts.Expression, b: ts.Expression) : ts.Expression {
        return genLogicalAND(this.exists(a), b);
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
                if (depth.dotNotation) {
                    if (res) {
                        if (resStr.length) {
                            res = genAdd(genAdd(res, genStr(`${resStr.join(".")}.`)), depth.propName);
                            resStr.length = 0;
                        }
                        else res = genAdd(genAdd(res, genStr(".")), depth.propName);
                    } else {
                        if (resStr.length) {
                            res = genAdd(genStr(`${resStr.join(".")}.`), depth.propName);
                            resStr.length = 0;
                        }
                        else res = depth.propName;
                    }
                } else {
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
        }
        if (res) {
            if (this.depth[this.depth.length - 1]?.dotNotation) {
                if (resStr.length) return genAdd(res, genStr(resStr.join(".")));
                else return res;
            } else {
                if (resStr.length) return genAdd(res, genStr(`].${resStr.join(".")}`));
                else return genAdd(res, genStr("]"));
            }
        } else return resStr.join(".");
    }

}