import ts from "typescript";
import { _access, Stringifyable } from "../expressionUtils";
import { isInt } from "../../utils";

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
    Union,
    Resolve,
    Recursive,
    Check
}

export interface CheckTypeHint {
    name?: string,
    error?: string,
    value?: string | number
}

export interface CheckTypeData {
    kind: TypeDataKinds.Check,
    expressions: string[],
    hints: CheckTypeHint[]
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

export interface NumberTypeData {
    kind: TypeDataKinds.Number,
    literal?: number,
}

export interface StringTypeData {
    kind: TypeDataKinds.String,
    literal?: string
}

/**
 * The actual type of the contents of the array is wrapped in a [[Validator]]
 * class, in the children array.
 */
export interface ArrayTypeData {
    kind: TypeDataKinds.Array
}

export const enum ObjectTypeDataExactOptions {
    RemoveExtra,
    RaiseError
}

export interface ObjectTypeData {
    kind: TypeDataKinds.Object,
    exact?: ObjectTypeDataExactOptions,
    stringIndexType?: ts.Type,
    numberIndexType?: ts.Type,
    useDeleteOperator?: boolean,
    couldBeNull?: boolean
}

export type TypeData = BooleanTypeData | SymbolTypeData | FunctionTypeData | UnionTypeData | ClassTypeData | BigIntTypeData | NullTypeData | TupleTypeData | NumberTypeData | StringTypeData | ArrayTypeData | ObjectTypeData | UndefinedTypeData | ResolveTypeData | RecursiveTypeData | CheckTypeData;

export type ValidatorTargetName = string | number | ts.Identifier;

export class Validator {
    _original: ts.Type;
    private _exp?: ts.Expression;
    customExp?: ts.Expression;
    name: ValidatorTargetName;
    parent?: Validator;
    typeData: TypeData;
    children!: Validator[];
    recursiveOrigins: ts.Type[];
    constructor(original: ts.Type, targetName: ValidatorTargetName, data: TypeData, exp?: ts.Expression, parent?: Validator, children?: ((parent: Validator) => Array<Validator|undefined>)|Validator[]) {
        this._original = original;
        this.name = targetName;
        this.typeData = data;
        this.customExp = exp;
        this.recursiveOrigins = [];
        if (parent) this.setParent(parent);
        if (children) {
            if (typeof children === "function") this.setChildren(children(this).filter(c => c) as Validator[]);
            else this.setChildren(children, true);
        }
        else this.children = [];
    }

    nameAsExpression() : ts.Expression {
        if (typeof this.name === "object") return this.name;
        else if (isInt(this.name))  return ts.factory.createNumericLiteral(this.name);
        else return ts.factory.createStringLiteral(this.name as string);
    }

    nameToString() : string {
        if (typeof this.name === "string") return this.name;
        else if (typeof this.name === "number") return this.name.toString();
        else return this.name.text;
    }

    path() : Stringifyable[] {
        if (!this.parent) return [this.nameAsExpression()];
        const parentPath = this.parent.path();
        if (this.name === "") return parentPath;
        if (typeof this.name === "object") parentPath.push("[", this.name, "]");
        else if (isInt(this.name)) parentPath.push(`[${this.name}]`);
        else parentPath.push(`.${this.name}`);
        return parentPath;
    }

    expression() : ts.Expression {
        if (this.customExp) return this.customExp;
        if (this._exp) return this._exp;
        if (!this.parent) return ts.factory.createNull();
        if (this.name === "") return this.parent.expression();
        return this._exp = _access(this.parent.expression(), this.name);
    }

    /**
     * If the type is a recursive type, or an union of a recursive type and undefined
     */
    isRedirect() : boolean {
        return this.typeData.kind === TypeDataKinds.Recursive || (this.typeData.kind === TypeDataKinds.Union && this.children.length === 2 && this.hasChildrenOfKind(TypeDataKinds.Undefined, TypeDataKinds.Recursive));
    }

    /**
     * If it will take more than expressions to validate the type (for loops, if...else chains)
     */
    isComplexType() : boolean {
        switch (this.typeData.kind) {
        case TypeDataKinds.Check:
            if (!this.children.length) return false;
            else return (this.children[0] as Validator).isComplexType();
        case TypeDataKinds.Object:
        case TypeDataKinds.Tuple:
        case TypeDataKinds.Union:
        case TypeDataKinds.Array:
            return true;
        default:
            return false;
        }
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
            if (parent._original.symbol && parent._original.symbol === t.symbol) return parent;
            parent = parent.parent;
        }
        return;
    }

    getNonOptionalValue() : Validator | undefined {
        if (this.typeData.kind === TypeDataKinds.Union && this.children.length === 2) {
            if ((this.children[0] as Validator).typeData.kind === TypeDataKinds.Undefined) return this.children[1] as Validator;
            else if ((this.children[1] as Validator).typeData.kind === TypeDataKinds.Undefined) return this.children[0] as Validator;
        }
        return undefined;
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
            break;
        case TypeDataKinds.String:
            if (this.typeData.literal) return 0;
            sum++;
            break;
        case TypeDataKinds.Boolean:
            if (this.typeData.literal) return 0;
            else return 1;
        case TypeDataKinds.Array:
            sum += 10;
            break;
        case TypeDataKinds.Union:
        case TypeDataKinds.Resolve:
            break;
        case TypeDataKinds.Null:
        case TypeDataKinds.Undefined:
        case TypeDataKinds.Symbol:
        case TypeDataKinds.BigInt:
        case TypeDataKinds.Function:
        case TypeDataKinds.Class:
        case TypeDataKinds.Tuple:
            sum += 2;
            break;
        case TypeDataKinds.Object:
            if (this.typeData.exact || this.typeData.stringIndexType || this.typeData.numberIndexType) sum += 8;
            sum += 2;
            break;
        case TypeDataKinds.Recursive:
            return 10;
        case TypeDataKinds.Check:
            sum += this.typeData.expressions.length;
        }
        return this.children.reduce((prev, current) => prev + current.weigh(), sum);
    }

    /**
     * Whether the validator is in it's simplest form - no children, extra checks, etc.
     */
    isSimple() : boolean {
        switch (this.typeData.kind) {
        case TypeDataKinds.Number:
        case TypeDataKinds.String:
        case TypeDataKinds.Boolean:
            return this.typeData.literal === undefined;
        case TypeDataKinds.Object:
        case TypeDataKinds.Array:
        case TypeDataKinds.Tuple:
            return this.children.length === 0;
        case TypeDataKinds.Check:
            return false;
        default:
            return true;
        }
    }

    getRawTypeData() : Record<string, unknown> {
        switch(this.typeData.kind) {
        case TypeDataKinds.Check: {
            const base = this.children[0] ? this.children[0].getRawTypeData() : { kind: TypeDataKinds.Check };
            for (const hint of this.typeData.hints) {
                if (hint.name) base[hint.name] = hint.value;
            }
            return base;
        }
        default:
            return this.typeData as unknown as Record<string, unknown>;
        }
    }

}