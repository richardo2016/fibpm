const test = require('test')
test.setup()

require('./unit/utils.scan')
require('./unit/utils.bracket')

require('./unit/option')

require('./unit/command')

require('./unit/cli')

require('./integrations/examples')

test.run(console.DEBUG)
