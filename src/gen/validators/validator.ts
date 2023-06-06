import ts from "typescript";

export const enum TypeDataKinds {
    Number,
    String,
    Array,
    Boolean,
    Symbol,
    BigInt,
    Null,
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

/**
 * Here the inner type is stored in the type data instead of in children,
 * because a validator may not be needed.
 */
export interface IfTypeData {
    kind: TypeDataKinds.If,
    innerType: ts.Type,
    fullCheck: boolean,
    expression: string
}

export type TypeData = BooleanTypeData | SymbolTypeData | FunctionTypeData | UnionTypeData | ClassTypeData | BigIntTypeData | NullTypeData | TupleTypeData | NumberTypeData | StringTypeData | ArrayTypeData | ObjectTypeData | IfTypeData;

export type ValidatorTargetName = string | number;

export class Validator {
    _original: ts.Type;
    expression: ts.Expression;
    name: ValidatorTargetName;
    typeData: TypeData;
    parent?: Validator;
    children: Validator[];
    constructor(original: ts.Type, targetName: ValidatorTargetName, data: TypeData, exp?: ts.Expression, parent?: Validator, children?: Validator[]) {
        this._original = original;
        this.name = targetName;
        this.typeData = data;
        this.parent = parent;
        this.children = children || [];
        for (const child of this.children) {
            child.parent = this;
        }

        if (exp) this.expression = exp;
        else if (this.parent) {
            if (typeof this.name === "string") this.expression = ts.factory.createPropertyAccessExpression(this.parent.expression, this.name);
            else this.expression = ts.factory.createElementAccessExpression(this.parent.expression, ts.factory.createNumericLiteral(this.name)); 
        }
        else this.expression = ts.factory.createNull();
    }

    path() : string {
        if (!this.parent) return this.name.toString();
        if (typeof this.name === "string") return this.parent.path() + `.${this.name}`;
        else return this.parent.path() + `[${this.name}]`;
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

    toString() : string {
        return this.path();
    }

}