const test = require('test');
test.setup();

require('./auth');
require('./errors');

test.run(console.DEBUG);