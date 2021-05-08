const test = require('test');
test.setup();

require('./mock');
require('./real');

test.run(console.DEBUG);