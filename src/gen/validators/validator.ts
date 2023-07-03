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
    Union,
    Resolve,
    Recursive
}

export interface RecursiveTypeData {
    kind: TypeDataKinds.Recursive
}

export interface ResolveTypeData {
    kind: TypeDataKinds.Resolve,
    type: ts.Type
}

export interface BooleanTypeData {
    kind: TypeDataKinds.Boolean,
    literal?: boolean
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

export const enum ObjectTypeDataExactOptions {
    RemoveExtra,
    RaiseError
}

export interface ObjectTypeData {
    kind: TypeDataKinds.Object,
    exact?: ObjectTypeDataExactOptions,
    useDeleteOperator?: boolean
}

export interface IfTypeData {
    kind: TypeDataKinds.If,
    fullCheck: boolean,
    expression: string
}

export type TypeData = BooleanTypeData | SymbolTypeData | FunctionTypeData | UnionTypeData | ClassTypeData | BigIntTypeData | NullTypeData | TupleTypeData | NumberTypeData | StringTypeData | ArrayTypeData | ObjectTypeData | IfTypeData | UndefinedTypeData | ResolveTypeData | RecursiveTypeData;

export type ValidatorTargetName = string | number | ts.Identifier;

export class Validator {
    _original: ts.Type;
    private _exp?: ts.Expression;
    customExp?: ts.Expression;
    name: ValidatorTargetName;
    parent?: Validator;
    typeData: TypeData;
    children!: Validator[];
    isRecursiveOrigin?: boolean;
    constructor(original: ts.Type, targetName: ValidatorTargetName, data: TypeData, exp?: ts.Expression, parent?: Validator, children?: ((parent: Validator) => Array<Validator|undefined>)|Validator[]) {
        this._original = original;
        this.name = targetName;
        this.typeData = data;
        this.customExp = exp;
        if (parent) this.setParent(parent);
        if (children) {
            if (typeof children === "function") this.setChildren(children(this).filter(c => c) as Validator[]);
            else this.setChildren(children, true);
        }
        else this.children = [];
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

    isRedirect() : boolean {
        return this.typeData.kind === TypeDataKinds.Recursive || (this.typeData.kind === TypeDataKinds.Union && this.children.length === 2 && this.hasChildrenOfKind(TypeDataKinds.Undefined, TypeDataKinds.Recursive));
    }

    setParent(parent: Validator) {
        this.parent = parent;
        delete this._exp;
    }

    setChildren(children: Validator[], setParent?: boolean) {
        if (setParent) {
            for (const child of children) {
                child.parent = this;
            }
        }
        children.sort((a, b) => a.weigh() - b.weigh());
        this.children = children;
    }

    setAlias(alias: () => ts.Identifier) : ts.Identifier {
        delete this._exp;
        if (this.customExp) return this.customExp as ts.Identifier;
        this.customExp = alias();
        return this.customExp as ts.Identifier;
    }

    setName(name: ValidatorTargetName) {
        this.name = name;
        delete this._exp;
    }

    setCustomExpression(exp: ts.Expression) {
        this.customExp = exp;
        delete this._exp;
    }

    hasChildrenOfKind(...kinds: TypeDataKinds[]) : boolean {
        const ownedKinds: Set<number> = new Set();
        for (const child of this.children) {
            if (kinds.includes(child.typeData.kind)) ownedKinds.add(child.typeData.kind);
        }
        return ownedKinds.size === kinds.length;
    }

    getChildrenOfKind(kind: TypeDataKinds) : Validator[] {
        const result = [];
        if (this.typeData.kind === kind) result.push(this);
        for (const child of this.children) {
            result.push(...child.getChildrenOfKind(kind));
        }
        return result;
    }

    getChildCountOfKind(kind: TypeDataKinds) : number {
        let counter = 0;
        for (const child of this.children) {
            if (child.typeData.kind === kind) counter++;
        }
        return counter;
    }

    getFirstLiteralChild() : Validator|undefined {
        for (const child of this.children) {
            if ((child.typeData.kind === TypeDataKinds.String && child.typeData.literal !== undefined) || (child.typeData.kind === TypeDataKinds.Number && child.typeData.literal !== undefined)) return child;
        }
        return;
    }

    getParentWithType(t: ts.Type) : Validator|undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Validator|undefined = this;
        while (parent) {
            if (parent._original === t) return parent;
            parent = parent.parent;
        }
        return;
    }

    exactProps() : ObjectTypeDataExactOptions|undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Validator | undefined = this;
        while (parent) {
            if (parent.typeData.kind === TypeDataKinds.Object && parent.typeData.exact !== undefined) return parent.typeData.exact;
            else parent = parent.parent;
        }
        return;
    }

    weigh() : number {
        let sum = 0;
        switch (this.typeData.kind) {
        case TypeDataKinds.Number:
            if (this.typeData.literal) return 0;
            sum++;
            if (this.typeData.type) sum += 2;
            if (this.typeData.max) sum++;
            if (this.typeData.min) sum++;
            break;
        case TypeDataKinds.String:
            if (this.typeData.literal) return 0;
            sum++;
            if (this.typeData.maxLen) sum++;
            if (this.typeData.minLen) sum++;
            if (this.typeData.length) sum++;
            if (this.typeData.matches) sum += 3;
            break;
        case TypeDataKinds.Boolean:
            if (this.typeData.literal) return 0;
            else return 1;
        case TypeDataKinds.Array:
            sum += 10;
            if (this.typeData.minLen) sum++;
            if (this.typeData.maxLen) sum++;
            if (this.typeData.length) sum++;
            break;
        case TypeDataKinds.Union:
        case TypeDataKinds.Resolve:
            break;
        case TypeDataKinds.Null:
        case TypeDataKinds.Undefined:
        case TypeDataKinds.Symbol:
        case TypeDataKinds.BigInt:
        case TypeDataKinds.Function:
        case TypeDataKinds.If:
            sum++;
            break;
        case TypeDataKinds.Class:
        case TypeDataKinds.Tuple:
            sum += 2;
            break;
        case TypeDataKinds.Object:
            if (this.typeData.exact) sum += 8;
            sum += 2;
            break;
        case TypeDataKinds.Recursive:
            return 10;
        }
        return this.children.reduce((prev, current) => prev + current.weigh(), sum);
    }

}