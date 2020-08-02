const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJ_ROOT = path.resolve(__dirname, '../');
const fpm = path.resolve(PROJ_ROOT, './bin/fpm.js');

const exe = process.execPath;

exports.openFpmCommnd = function (cmd, ...args) {
    const subprocess = process.open(exe, [
        fpm,
        cmd,
        ...args
    ])

    return subprocess;
}

function normalize2UnixEOL (content = '') {
    return content.replace(/\r\n/g, '\n')
}

exports.readFromFpmCommand = function (cmd, ...args) {
    const subprocess = exports.openFpmCommnd(cmd, ...args);

    return normalize2UnixEOL(
        subprocess.stdout.readLines()
        .map(x => x.trimEnd())
        .join(os.EOL)
    )
}

exports.runFpmCommnd = function (cmd, ...args) {
    const subprocess = process.run(exe, [
        fpm,
        cmd,
        ...args
    ])

    return subprocess;
}

exports.readHelpOutput = function (cmdName, ctxVars = {}) {
    let content = fs.readTextFile(path.resolve(PROJ_ROOT, `./test/help-output/${cmdName}.txt`))

    Object.keys(ctxVars).forEach(plc => {
        content = content.replace(
            new RegExp(`({__${plc}__})`, 'g'),
            ctxVars[plc]
        )
    })

    return normalize2UnixEOL(content)
}