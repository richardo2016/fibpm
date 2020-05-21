import FCli = require('./Cli')

const FN: FCli.ExportModule = (...args: any) => new FCli(...args)
export = FN
