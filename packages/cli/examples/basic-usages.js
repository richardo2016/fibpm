const cli = require('../')()

cli.option('--type [type]', 'Choose a project type')

const parsed = cli.parse()

console.dir(parsed)