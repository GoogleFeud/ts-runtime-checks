

export function hasBit(thing: { flags: number }, bit: number) : boolean {
    return (thing.flags & bit) !== 0;
}