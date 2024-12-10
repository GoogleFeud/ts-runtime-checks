import ts from "typescript";
import {_access, Stringifyable} from "../expressionUtils";
import {addArticle, isInt} from "../../utils";
import {CodeReference} from "./genValidator";

export enum TypeDataKinds {
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
    Check,
    // The transform kind has precedence over Checks
    Transform
}

export interface CheckTypeHint {
    name?: string;
    error?: string;
    value?: string | number;
}

export interface CheckTypeData {
    kind: TypeDataKinds.Check;
    expressions: CodeReference[];
    altHints: CheckTypeHint[];
    alternatives: CodeReference[];
    hints: CheckTypeHint[];
}

export interface RecursiveTypeData {
    kind: TypeDataKinds.Recursive;
}

export interface ResolveTypeData {
    kind: TypeDataKinds.Resolve;
    type: ts.Type;
}

export interface BooleanTypeData {
    kind: TypeDataKinds.Boolean;
    literal?: boolean;
}

export interface SymbolTypeData {
    kind: TypeDataKinds.Symbol;
}

export interface ClassTypeData {
    kind: TypeDataKinds.Class;
}

export interface FunctionTypeData {
    kind: TypeDataKinds.Function;
}

export interface BigIntTypeData {
    kind: TypeDataKinds.BigInt;
}

export interface NullTypeData {
    kind: TypeDataKinds.Null;
}

export interface UndefinedTypeData {
    kind: TypeDataKinds.Undefined;
}

export interface TupleTypeData {
    kind: TypeDataKinds.Tuple;
}

export interface UnionTypeData {
    kind: TypeDataKinds.Union;
}

export interface NumberTypeData {
    kind: TypeDataKinds.Number;
    literal?: number;
}

export interface StringTypeData {
    kind: TypeDataKinds.String;
    literal?: string;
}

/**
 * The actual type of the contents of the array is wrapped in a [[Validator]]
 * class, in the children array.
 */
export interface ArrayTypeData {
    kind: TypeDataKinds.Array;
}

export const enum ObjectTypeDataExactOptions {
    RemoveExtra,
    RaiseError
}

export interface ObjectTypeData {
    kind: TypeDataKinds.Object;
    numberIndexInfo?: [Validator, Validator];
    stringIndexInfo?: [Validator, Validator];
    exact?: ObjectTypeDataExactOptions;
    useDeleteOperator?: boolean;
    couldBeNull?: boolean;
}

export interface TransformTypeData {
    kind: TypeDataKinds.Transform;
    transformations: CodeReference[];
    rest?: Validator;
    postChecks?: Validator;
}

export interface BaseTypeData {
    isStringWrapped?: boolean;
}

export type TypeData = (
    | BooleanTypeData
    | SymbolTypeData
    | FunctionTypeData
    | UnionTypeData
    | ClassTypeData
    | BigIntTypeData
    | NullTypeData
    | TupleTypeData
    | NumberTypeData
    | StringTypeData
    | ArrayTypeData
    | ObjectTypeData
    | UndefinedTypeData
    | ResolveTypeData
    | RecursiveTypeData
    | CheckTypeData
    | TransformTypeData
) &
    BaseTypeData;

export type ValidatorTargetName = string | number | ts.Identifier;

export class Validator {
    _original: ts.Type;
    private _exp?: ts.Expression;
    unorderedChildren!: Validator[];
    customExp?: ts.Expression;
    name: ValidatorTargetName;
    parent?: Validator;
    typeData: TypeData;
    children!: Validator[];
    recursiveOrigins: ts.Type[];
    constructor(
        original: ts.Type,
        targetName: ValidatorTargetName,
        data: TypeData,
        exp?: ts.Expression,
        parent?: Validator,
        children?: ((parent: Validator) => Array<Validator | undefined>) | Validator[]
    ) {
        this._original = original;
        this.name = targetName;
        this.typeData = data;
        this.customExp = exp;
        this.recursiveOrigins = [];
        if (parent) this.setParent(parent);
        if (children) {
            if (typeof children === "function") this.setChildren(children(this).filter(c => c) as Validator[]);
            else this.setChildren(children, true);
        } else this.children = [];
    }

    nameAsExpression(): ts.Expression {
        if (typeof this.name === "object") return this.name;
        else if (isInt(this.name)) return ts.factory.createNumericLiteral(this.name);
        else return ts.factory.createStringLiteral(this.name as string);
    }

    nameToString(): string {
        if (typeof this.name === "string") return this.name;
        else if (typeof this.name === "number") return this.name.toString();
        else return this.name.text;
    }

    path(): Stringifyable[] {
        if (!this.parent) return [this.nameAsExpression()];
        const parentPath = this.parent.path();
        if (this.name === "") return parentPath;
        if (typeof this.name === "object") parentPath.push("[", this.name, "]");
        else if (isInt(this.name)) parentPath.push(`[${this.name}]`);
        else parentPath.push(`.${this.name}`);
        return parentPath;
    }

    expression(): ts.Expression {
        if (this.customExp) return this.customExp;
        if (this._exp) return this._exp;
        if (!this.parent) return ts.factory.createNull();
        if (this.name === "") return this.parent.expression();
        return (this._exp = _access(this.parent.expression(), this.name, this.typeData.isStringWrapped));
    }

    /**
     * If the type is a recursive type, or an union of a recursive type and undefined
     */
    isRedirect(): boolean {
        return (
            this.typeData.kind === TypeDataKinds.Recursive ||
            (this.typeData.kind === TypeDataKinds.Union && this.children.length === 2 && this.hasChildrenOfKind(TypeDataKinds.Undefined, TypeDataKinds.Recursive))
        );
    }

    /**
     * If it will take more than expressions to validate the type (for loops, if...else chains)
     */
    isComplexType(): boolean {
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
        this.unorderedChildren = [...children];
        children.sort((a, b) => a.weigh() - b.weigh());
        this.children = children;
    }

    setAlias(alias: () => ts.Identifier): ts.Identifier {
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

    hasChildrenOfKind(...kinds: TypeDataKinds[]): boolean {
        const ownedKinds: Set<number> = new Set();
        for (const child of this.children) {
            if (kinds.includes(child.typeData.kind)) ownedKinds.add(child.typeData.kind);
        }
        return ownedKinds.size === kinds.length;
    }

    getChildrenOfKind(kind: TypeDataKinds): Validator[] {
        const result = [];
        if (this.typeData.kind === kind) result.push(this);
        for (const child of this.children) {
            result.push(...child.getChildrenOfKind(kind));
        }
        return result;
    }

    canBeOfKind(kind: TypeDataKinds): boolean {
        if (this.typeData.kind === kind) return true;
        else if (this.typeData.kind === TypeDataKinds.Union) {
            for (const child of this.children) {
                if (child.typeData.kind === kind) return true;
            }
        }
        return false;
    }

    getFirstLiteralChild(): Validator | undefined {
        for (const child of this.children) {
            if ((child.typeData.kind === TypeDataKinds.String && child.typeData.literal !== undefined) || (child.typeData.kind === TypeDataKinds.Number && child.typeData.literal !== undefined))
                return child;
        }
        return;
    }

    getParentWithType(t: ts.Type): Validator | undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Validator | undefined = this;
        while (parent) {
            if (parent._original.symbol && parent._original.symbol === t.symbol) return parent;
            parent = parent.parent;
        }
        return;
    }

    getNonOptionalValue(): Validator | undefined {
        if (this.typeData.kind === TypeDataKinds.Union && this.children.length === 2) {
            if ((this.children[0] as Validator).typeData.kind === TypeDataKinds.Undefined) return this.children[1] as Validator;
            else if ((this.children[1] as Validator).typeData.kind === TypeDataKinds.Undefined) return this.children[0] as Validator;
        }
        return undefined;
    }

    exactProps(): ObjectTypeDataExactOptions | undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent: Validator | undefined = this;
        while (parent) {
            if (parent.typeData.kind === TypeDataKinds.Object && parent.typeData.exact !== undefined) return parent.typeData.exact;
            else parent = parent.parent;
        }
        return;
    }

    // Iteration / recursion automatically adds 10 to the weight
    weigh(): number {
        let sum = 0;
        switch (this.typeData.kind) {
            case TypeDataKinds.Number:
                if (this.typeData.literal) return 0;
                sum++;
                break;
            case TypeDataKinds.String:
                // string comparisons are definitely slower than number / bool literals
                if (this.typeData.literal) return 0.5;
                sum++;
                break;
            case TypeDataKinds.Boolean:
                if (this.typeData.literal) return 0;
                // Boolean checks are faster than string / number checks
                else return 0.5;
            case TypeDataKinds.Array:
                sum += 10;
                break;
            case TypeDataKinds.Union:
            case TypeDataKinds.Resolve:
                break;
            case TypeDataKinds.Null:
            case TypeDataKinds.Undefined:
                sum += 1;
                break;
            case TypeDataKinds.Symbol:
            case TypeDataKinds.BigInt:
            case TypeDataKinds.Function:
            case TypeDataKinds.Class:
            case TypeDataKinds.Tuple:
                sum += 3;
                break;
            case TypeDataKinds.Object:
                if (this.typeData.exact || this.typeData.stringIndexInfo || this.typeData.numberIndexInfo) sum += 8;
                sum += 3;
                break;
            case TypeDataKinds.Recursive:
                return 10;
            case TypeDataKinds.Check:
                sum += this.typeData.expressions.length;
        }
        return this.children.reduce((prev, current) => prev + current.weigh(), sum);
    }

    getBaseType(): TypeDataKinds {
        if (this.typeData.kind === TypeDataKinds.Check && this.children.length) return this.children[0]!.typeData.kind;
        return this.typeData.kind;
    }

    /**
     * Whether the validator is in it's simplest form - no children, extra checks, etc.
     */
    isSimple(): boolean {
        switch (this.typeData.kind) {
            case TypeDataKinds.Number:
            case TypeDataKinds.String:
            case TypeDataKinds.Boolean:
                return this.typeData.literal === undefined;
            case TypeDataKinds.Object:
            case TypeDataKinds.Array:
            case TypeDataKinds.Tuple:
            case TypeDataKinds.Check:
                return this.children.length === 0;
            case TypeDataKinds.Union:
                return false;
            default:
                return true;
        }
    }

    getRawTypeData(): Record<string, unknown> {
        switch (this.typeData.kind) {
            case TypeDataKinds.Union:
                return {
                    kind: TypeDataKinds.Union,
                    variants: this.children.map(child => child.getRawTypeData())
                };
            case TypeDataKinds.Transform:
                if (this.typeData.rest) return this.typeData.rest.getRawTypeData();
                return {kind: TypeDataKinds.Transform};
            case TypeDataKinds.Check: {
                const base = this.children[0] ? this.children[0].getRawTypeData() : {kind: TypeDataKinds.Check};
                for (const hint of this.typeData.hints) {
                    if (hint.name) base[hint.name] = hint.value;
                }
                if (this.typeData.altHints.length) {
                    base.alt = {};
                    for (const altHint of this.typeData.altHints) {
                        if (altHint.name) (base.alt as Record<string, unknown>)[altHint.name] = altHint.value;
                    }
                }
                return base;
            }
            default:
                return this.typeData as unknown as Record<string, unknown>;
        }
    }

    clone(): Validator {
        return new Validator(
            this._original,
            this.name,
            {...this.typeData},
            this._exp,
            this.parent,
            this.children.map(c => c.clone())
        );
    }

    inherits(other: Validator): void {
        this.customExp = other.expression();
    }

    cmp(other: Validator): boolean {
        if (this.typeData.kind !== other.typeData.kind || this.children.length !== other.children.length) return false;
        for (let i = 0; i < this.children.length; i++) {
            const thisChild = this.children[i] as Validator;
            const otherChild = other.children[i] as Validator;
            if (!thisChild.cmp(otherChild)) return false;
        }
        return true;
    }

    translate(prefix?: string, includeArticle = false): string {
        let value: string;
        switch (this.typeData.kind) {
            case TypeDataKinds.String:
                if (this.typeData.literal) {
                    value = `"${this.typeData.literal}"`;
                    includeArticle = false;
                } else value = "string";
                break;
            case TypeDataKinds.Number:
                if (this.typeData.literal) {
                    value = this.typeData.literal.toString();
                    includeArticle = false;
                } else value = "number";
                break;
            case TypeDataKinds.Boolean:
                if (this.typeData.literal) {
                    value = this.typeData.literal ? "true" : "false";
                    includeArticle = false;
                } else value = "boolean";
                break;
            case TypeDataKinds.Undefined:
                value = "undefined";
                break;
            case TypeDataKinds.Null:
                value = "null";
                break;
            case TypeDataKinds.BigInt:
                value = "bigint";
                break;
            case TypeDataKinds.Function:
                value = "function";
                break;
            case TypeDataKinds.Symbol:
                value = "symbol";
                break;
            case TypeDataKinds.Class:
                value = `instance of "${this._original.symbol.name}"`;
                break;
            case TypeDataKinds.Resolve:
                value = "type parameter";
                break;
            case TypeDataKinds.Recursive:
                includeArticle = false;
                value = this._original.symbol.name;
                break;
            case TypeDataKinds.Transform:
                includeArticle = false;
                value = this.typeData.rest?.translate(undefined, includeArticle) || "transformation";
                break;
            case TypeDataKinds.Array:
                if (!this.children.length) value = "array";
                else value = `array<${this.children[0]!.translate()}>`;
                break;
            case TypeDataKinds.Object:
                if (this._original.symbol) {
                    if (this._original.symbol.name.startsWith("__")) {
                        value = "object";
                    } else {
                        value = this._original.symbol.name;
                        includeArticle = false;
                    }
                } else {
                    value = "object";
                }
                break;
            case TypeDataKinds.Tuple:
                value = `[${this.unorderedChildren.map(child => child.translate()).join(", ")}]`;
                includeArticle = false;
                break;
            case TypeDataKinds.Union:
                value = this.unorderedChildren.map(child => child.translate()).join(" | ");
                includeArticle = false;
                break;
            case TypeDataKinds.Check: {
                const errMessages = this.typeData.hints.map(h => h.error || "").join(" & ");
                const altErrors = this.typeData.altHints.map(h => h.error || "").join(" | ");
                const mainType = this.children[0]?.translate(prefix, includeArticle);
                includeArticle = false;
                return `${mainType ? `${mainType}, ` : ""}${errMessages}${altErrors ? ` or ${altErrors}` : ""}`;
            }
        }
        if (includeArticle) value = addArticle(value);
        return prefix ? prefix + value : value;
    }
}
