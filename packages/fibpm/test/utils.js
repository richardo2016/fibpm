const fs = require('fs');
const path = require('path');
const os = require('os');
const io = require('io');

const PROJ_ROOT = path.resolve(__dirname, '../');
const fpm = path.resolve(PROJ_ROOT, './bin/fpm.js');

const exe = process.execPath;

function runProcess (...args) {
    if (process.run) {
        return process.run(...args);
    }

    return require('child_process').run(...args);
}

function openProcess (...args) {
    if (process.open) {
        return process.open(...args);
    }

    return require('child_process').spawn(...args);
}

exports.openFpmCommnd = function (cmd, ...args) {
    const subprocess = openProcess(exe, [
        fpm,
        cmd,
        ...args
    ])

    return {
        stdout: new io.BufferedStream(subprocess.stdout),
        stderr: new io.BufferedStream(subprocess.stderr),
    };
}

function normalize2UnixEOL (content = '') {
    return content.replace(/\r\n/g, '\n')
}

exports.readFromFpmCommand = function (cmd, ...args) {
    const { stdout } = exports.openFpmCommnd(cmd, ...args);

    return normalize2UnixEOL(
        stdout.readLines()
        .map(x => x.trimEnd())
        .join(os.EOL)
    )
}

exports.runFpmCommnd = function (cmd, ...args) {
    const subprocess = runProcess(exe, [
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