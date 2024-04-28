import { Validator, TypeDataKinds } from "../gen/validators";

export function getUnionMembers(validators: Validator[]): {
    compound: Validator[];
    normal: Validator[];
    object: [Validator, Validator][];
    isNullable: boolean;
} {
    const compoundTypes: Validator[] = [],
        normalTypes: Validator[] = [],
        objectTypes: [Validator, Validator][] = [];
    let isNullable = false;
    const objectKind = validators.filter(v => v.typeData.kind === TypeDataKinds.Object).length;
    for (const child of validators) {
        if (child.typeData.kind === TypeDataKinds.Undefined) {
            isNullable = true;
            continue;
        } else if (child.children.length && child.typeData.kind === TypeDataKinds.Object && objectKind > 1) {
            const idRepresent = child.getFirstLiteralChild();
            if (idRepresent) {
                child.children.splice(child.children.indexOf(idRepresent), 1);
                objectTypes.push([child, idRepresent]);
            } else compoundTypes.push(child);
        } else if (child.isComplexType()) compoundTypes.push(child);
        else normalTypes.push(child);
    }
    return {
        compound: compoundTypes,
        normal: normalTypes,
        object: objectTypes,
        isNullable
    };
}