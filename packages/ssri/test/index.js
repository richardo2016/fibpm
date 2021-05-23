const test = require('test');
test.setup();

require('./check');
require('./check2');
require('./create');
require('./from');
require('./integrity');
require('./parse');
require('./stringify');

test.run(console.DEBUG);