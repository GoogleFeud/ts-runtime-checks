/* eslint-disable @typescript-eslint/no-explicit-any */


export function call(fn: (...params: Array<any>) => any, ...params: Array<any>) {
    return fn.bind(undefined, ...params);
}