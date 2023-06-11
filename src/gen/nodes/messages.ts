import ts from "typescript";
import { _str } from "./utils";

export type Stringifyable = string | ts.Expression;

export const MESSAGES = {
    ToBeEqual: (a: Stringifyable, b: Stringifyable) => concat`${a} to be equal to ${b}.`,
    ToBe: (a: Stringifyable, b: Stringifyable) => concat`${a} to be ${b}.`
} as const;

export function concat(strings: TemplateStringsArray, ...elements: Stringifyable[]) : ts.Expression[] {
    const finalElements: Stringifyable[] = [];
    for (let i=0; i < strings.length; i++) {
        finalElements.push(strings[i] as string);
        if (i < elements.length) finalElements.push(elements[i] as Stringifyable);
    }
    return joinElements(finalElements);
}

export function joinElements(elements: Stringifyable[], separator = "") : ts.Expression[] {
    const output: ts.Expression[] = [];
    for (const element of elements) {
        const lastElement = output[output.length - 1];
        const currentElementText = typeof element === "string" ? element : ts.isStringLiteral(element) || ts.isNumericLiteral(element) ? element.text : undefined;
        if (lastElement && (ts.isStringLiteral(lastElement) || ts.isNumericLiteral(lastElement))) {
            if (currentElementText !== undefined) {
                if (currentElementText !== "") output[output.length - 1] = _str(lastElement.text + separator + currentElementText);
            }
            else output.push(element as ts.Expression);
        } else {
            if (currentElementText !== undefined) {
                if (currentElementText !== "") output.push(_str(lastElement ? separator : "" + currentElementText));
            }
            else output.push(element as ts.Expression);
        }
    }
    return output;
}