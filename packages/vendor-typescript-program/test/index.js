const test = require('test');
test.setup();

const coroutine = require('coroutine');

require('./compile-single-entry')

// console.log('count coroutine.fibers:', coroutine.fibers.length);
console.dir(coroutine.fibers);

assert.equal(coroutine.fibers.length, 1);

test.run(console.DEBUG);