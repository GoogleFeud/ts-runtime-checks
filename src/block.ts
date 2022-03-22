import ts from "typescript";

export interface Block<T> {
    nodes: Array<T>,
    cache: Set<ts.Symbol>,
    parent: Block<unknown> | undefined
}

export function createBlock<T>(parent?: Block<unknown> | undefined) : Block<T> {
    return { nodes: [], cache: new Set(), parent };
}

export function isInCache(sym: ts.Symbol, block: Block<unknown>) : boolean {
    let parent: Block<unknown> | undefined = block;
    while (parent) {
        if (parent.cache.has(sym)) return true;
        parent = parent.parent;
    }
    return false;
}