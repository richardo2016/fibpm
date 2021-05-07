const test = require('test');
test.setup();

require('./auth');
require('./errors');
require('./check-response');

test.run(console.DEBUG);