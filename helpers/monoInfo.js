const monoPkgJson = require('../package.json')

const monoSettings = monoPkgJson.mono || {};
const monoScope = monoSettings.scope || monoPkgJson.monoscope || monoPkgJson.name

module.exports = {
    monoName: monoSettings.name || monoPkgJson.name,
    monoScope: monoScope,
    monoPkgJson: monoPkgJson,
    gitPath: monoSettings.git_path || `${monoPkgJson.name}/${monoPkgJson.name}`,
    scopePrefix: `@${monoScope}`,
}