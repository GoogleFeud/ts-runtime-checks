import ts from "typescript";

// export class Block {
//     nodes: Array<ts.Node>;
//     cache: Set<ts.Symbol>;
//     events: Array<() => void>;
//     parent: Block<unknown> | undefined;
//     constructor(parent?: Block) {
//         this.nodes = [];
//         this.cache = new Set();
//         this.parent = parent;
//         this.events = [];
//     }

//     isInCache(sym: ts.Symbol): boolean {
//         // eslint-disable-next-line @typescript-eslint/no-this-alias
//         let parent: Block<unknown> | undefined = this;
//         while (parent) {
//             if (parent.cache.has(sym)) return true;
//             parent = parent.parent;
//         }
//         return false;
//     }

// }

export interface Block<T> {
    nodes: Array<T>;
    cache: Set<ts.Symbol>;
    events: Array<() => void>;
    parent: Block<unknown> | undefined;
}

export function createBlock<T>(parent?: Block<unknown> | undefined): Block<T> {
    return {nodes: [], cache: new Set(), parent, events: []};
}

export function isInCache(sym: ts.Symbol, block: Block<unknown>): boolean {
    let parent: Block<unknown> | undefined = block;
    while (parent) {
        if (parent.cache.has(sym)) return true;
        parent = parent.parent;
    }
    return false;
}

export function listen(block: Block<unknown>, event: () => void): void {
    block.events.push(event);
}

export function runEvents(block: Block<unknown>): void {
    if (!block.events.length) return;
    for (const event of block.events) {
        event();
    }
    block.events.length = 0;
}
