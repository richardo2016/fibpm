const test = require('test')
test.setup()

require('./case1/spec')

require.main === module && test.run(console.DEBUG)