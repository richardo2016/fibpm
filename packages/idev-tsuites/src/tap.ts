// tap like api

import _test = require('test');
import _assert = require('assert');

import * as helpers from './helpers';

function wrapAssertWithItDesc (fn: Function) {
    return <TArgs extends [...any, string]>(...args: TArgs) => {
        const desc: string = args.pop();

        _test.it(desc, () => {
            fn.apply(null, args);
        });
    }
}

type ICBO = {
    done(): void
}
export const test = (test_desc: string, fn: (cbo?: ICBO) => void) => {
    _test.describe(test_desc, (_done: Function) => {
        const cbo = {
            equal: wrapAssertWithItDesc(_assert.equal),

            done: () => {
                _done();
            }
        }

        if (fn.length > 0) {
            fn(cbo);
        } else {
            fn()
            cbo.done();
        }
    });
}