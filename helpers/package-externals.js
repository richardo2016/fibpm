const fs = require('fs')
const path = require('path')

const { scopePrefix } = require('./monoInfo')

const componentDirs = fs.readdirSync(
    path.resolve(__dirname, '../packages')
).filter(dname => 
    dname.indexOf('ui-') === 0
    || dname.indexOf('widget-') === 0
    || dname.indexOf('internal-') === 0
    || dname.indexOf('icomponent-') === 0
    || dname.indexOf('imodule-') === 0
    || dname === 'common'
)

const externals = [
]

module.exports = {
    externals,
    internalDeps: externals
        .concat(componentDirs.map(com_dname => `${scopePrefix}/${com_dname}`))
}