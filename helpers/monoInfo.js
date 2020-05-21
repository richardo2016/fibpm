const monoPkgJson = require('../package.json')

module.exports = {
    monoName: monoPkgJson.name,
    monoScope: monoPkgJson.monoscope || monoPkgJson.name,
    monoPkgJson: monoPkgJson,
    gitPath: monoPkgJson.git_path || `${monoPkgJson.name || monoPkgJson.monoscope}/${monoPkgJson.name}`,
    scopePrefix: `@${monoPkgJson.name || monoPkgJson.monoscope}`,
}