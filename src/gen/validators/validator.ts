import ts from "typescript";
import { _access, Stringifyable } from "../expressionUtils";

export const enum TypeDataKinds {
    Number,
    String,
    Array,
    Boolean,
    Symbol,
    BigInt,
    Null,
    Undefined,
    Tuple,
    Object,
    Class,
    Function,
    If,
    Union
}

export interface BooleanTypeData {
    kind: TypeDataKinds.Boolean
}

export interface SymbolTypeData {
    kind: TypeDataKinds.Symbol
}

export interface ClassTypeData {
    kind: TypeDataKinds.Class
}

export interface FunctionTypeData {
    kind: TypeDataKinds.Function
}

export interface BigIntTypeData {
    kind: TypeDataKinds.BigInt
}

export interface NullTypeData {
    kind: TypeDataKinds.Null
}

export interface UndefinedTypeData {
    kind: TypeDataKinds.Undefined
}

export interface TupleTypeData {
    kind: TypeDataKinds.Tuple
}

export interface UnionTypeData {
    kind: TypeDataKinds.Union
}

export const enum NumberTypes {
    Integer,
    Float
}

export interface NumberTypeData {
    kind: TypeDataKinds.Number,
    type?: NumberTypes,
    literal?: number,
    min?: ts.Expression,
    max?: ts.Expression,
}

export interface StringTypeData {
    kind: TypeDataKinds.String,
    literal?: string,
    length?: ts.Expression,
    matches?: ts.Expression,
    minLen?: ts.Expression,
    maxLen?: ts.Expression
}

/**
 * The actual type of the contents of the array is wrapped in a [[Validator]]
 * class, in the children array.
 */
export interface ArrayTypeData {
    kind: TypeDataKinds.Array,
    length?: ts.Expression,
    minLen?: ts.Expression,
    maxLen?: ts.Expression
}

export interface ObjectTypeData {
    kind: TypeDataKinds.Object,
    exact?: boolean
}

export interface IfTypeData {
    kind: TypeDataKinds.If,
    fullCheck: boolean,
    expression: string
}

export type TypeData = BooleanTypeData | SymbolTypeData | FunctionTypeData | UnionTypeData | ClassTypeData | BigIntTypeData | NullTypeData | TupleTypeData | NumberTypeData | StringTypeData | ArrayTypeData | ObjectTypeData | IfTypeData | UndefinedTypeData;

export type ValidatorTargetName = string | number | ts.Identifier;

export class Validator {
    _original: ts.Type;
    private _exp?: ts.Expression;
    private customExp?: ts.Expression;
    name: ValidatorTargetName;
    parent?: Validator;
    typeData: TypeData;
    children: Validator[];
    constructor(original: ts.Type, targetName: ValidatorTargetName, data: TypeData, exp?: ts.Expression, parent?: Validator, children?: Validator[]) {
        this._original = original;
        this.name = targetName;
        this.typeData = data;
        this.customExp = exp;
        this.children = children || [];
        if (parent) this.setParent(parent);
        for (const child of this.children) {
            child.setParent(this);
        }
    }

    nameAsExpression() : ts.Expression {
        if (typeof this.name === "string") return ts.factory.createStringLiteral(this.name);
        else if (typeof this.name === "number") return ts.factory.createNumericLiteral(this.name);
        else return this.name;
    }

    path() : Stringifyable[] {
        if (!this.parent) return [this.nameAsExpression()];
        const parentPath = this.parent.path();
        if (this.name === "") return parentPath;
        if (typeof this.name === "string") parentPath.push(`.${this.name}`);
        else if (typeof this.name === "number") parentPath.push(`[${this.name}]`);
        else parentPath.push("[", this.name, "]");
        return parentPath;
    }

    expression() : ts.Expression {
        if (this.customExp) return this.customExp;
        if (this._exp) return this._exp;
        if (!this.parent) return ts.factory.createNull();
        if (this.name === "") return this.parent.expression();
        return this._exp = _access(this.parent.expression(), this.name);
    }

    setParent(parent: Validator) {
        this.parent = parent;
        delete this._exp;
    }

    setName(name: ValidatorTargetName) {
        this.name = name;
        delete this._exp;
    }

    exactProps() : boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Validator | undefined = this;
        while (parent) {
            if (parent.typeData.kind === TypeDataKinds.Object && parent.typeData.exact) return true;
            else parent = parent.parent;
        }
        return false;
    }

    /*
    getTypeName() : string {
        switch (this.typeData.kind) {
        case TypeDataKinds.String: {
            if (this.typeData.literal) return `"${this.typeData.literal}"`;
            else return "string";
        }
        case TypeDataKinds.Number: {
            if (this.typeData.literal) return this.typeData.literal.toString();
            else return "number";
        }
        case TypeDataKinds.Boolean: return "boolean";
        case TypeDataKinds.Array: return `${(this.children[0] as Validator).getTypeName()}[]`;
        case TypeDataKinds.Class: return this.name.toString();
        case TypeDataKinds.BigInt: return "BigInt";
        case TypeDataKinds.Symbol: return "symbol";
        case TypeDataKinds.Tuple: return `[${this.children.map(c => c.getTypeName()).join(", ")}]`;
        case TypeDataKinds.Function: return "function";
        case TypeDataKinds.Object: return "object";
        case TypeDataKinds.Undefined: return "undefined";
        case TypeDataKinds.Null: return "null";
        case TypeDataKinds.If: return `to satisfy "${this.typeData.expression}"`;
        case TypeDataKinds.Union: return ``
        }
    }
    */

}