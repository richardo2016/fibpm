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

export function runAndReturnError (fnt: Function) {
    let err;

    try {
        fnt();
    } catch (error) {
        err = error 
    }

    return err;
}

export function assertThrowError (fnt: Function, regExp: string | RegExp) {
    const err = runAndReturnError(fnt);

    assert.isTrue(err instanceof Error);
    
    if (regExp instanceof RegExp) {
        assert.isTrue(regExp.test(err.message))
    } else if (typeof regExp === 'string') {
        assert.isTrue(err.message.includes(regExp))
    }
}


export function doesNotThrow (fnt: Function) {
    const err = runAndReturnError(fnt);

    assert.equal(err, undefined);
}

