const cli = require('..')()

cli
  .command('build', 'Build project', {
    ignoreOptionDefaultValue: true
  })
  .option('--type [type]', 'Choose a project type', {
    default: 'fibjs'
  })

const parsed = cli.parse()

console.log(JSON.stringify(parsed, null, 2))