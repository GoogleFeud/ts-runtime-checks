import ts from "typescript";
import { _bin_chain, _str } from "./utils";

export type Stringifyable = string | ts.Expression;

export const MESSAGES = {
    ToBeEqual: (a: Stringifyable, b: Stringifyable) => concat`${a} to be equal to ${b}.`,
    ToBe: (a: Stringifyable, b: Stringifyable) => concat`${a} to be ${b}.`,
    MinLen: (a: Stringifyable, b: Stringifyable) => concat`${a} to have a minimum length of ${b}.`,
    MaxLen: (a: Stringifyable, b: Stringifyable) => concat`${a} to have a minimum length of ${b}.`
} as const;

export function concat(strings: TemplateStringsArray, ...elements: Stringifyable[]) : ts.Expression {
    const finalElements: Stringifyable[] = [];
    for (let i=0; i < strings.length; i++) {
        finalElements.push(strings[i] as string);
        if (i < elements.length) finalElements.push(elements[i] as Stringifyable);
    }
    return joinElements(finalElements);
}

export function joinElements(elements: Stringifyable[]) : ts.Expression {
    const output: ts.Expression[] = [];
    for (const element of elements) {
        const lastElement = output[output.length - 1];
        if (lastElement && (ts.isStringLiteral(lastElement) || ts.isNumericLiteral(lastElement))) {
            if (typeof element === "string") output[output.length - 1] = _str(lastElement.text + element);
            else if (ts.isStringLiteral(element) || ts.isNumericLiteral(element)) output[output.length - 1] = _str(lastElement.text + element.text);
            else output.push(element);
        } else {
            if (typeof element === "string") output.push(_str(element));
            else output.push(element);
        }
    }
    return _bin_chain(output, ts.SyntaxKind.PlusToken);
}