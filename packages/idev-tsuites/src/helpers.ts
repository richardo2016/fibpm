import util = require('util')
import assert = require('assert')

export function shouldFail(runner: Function) {
    let error: Error
    try {
        runner();
    } catch (err) {
        error = err;
    }

    assert.ok(error instanceof Error);

    return (func: (err: Error) => any) => func(error)
}

export function assertLike(obj1: object, obj2: object) {
    const keys = Object.keys(obj2);

    assert.deepEqual(util.pick(obj1, keys), obj2);
}

export function assertMatch(input: string, regexp: RegExp) {
    assert.isTrue(regexp.test(input));
}