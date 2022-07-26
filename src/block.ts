import ts from "typescript";

export interface Block<T> {
    nodes: Array<T>,
    cache: Set<ts.Symbol>,
    events: Array<() => void>,
    parent: Block<unknown> | undefined
}

export function createBlock<T>(parent?: Block<unknown> | undefined) : Block<T> {
    return { nodes: [], cache: new Set(), parent, events: [] };
}

export function isInCache(sym: ts.Symbol, block: Block<unknown>) : boolean {
    let parent: Block<unknown> | undefined = block;
    while (parent) {
        if (parent.cache.has(sym)) return true;
        parent = parent.parent;
    }
    return false;
}

export function listen(block: Block<unknown>, event: () => void) : void {
    block.events.push(event);
}

export function runEvents(block: Block<unknown>) : void {
    if (!block.events.length) return;
    for (const event of block.events) {
        event();
    }
    block.events.length = 0;
}