const test = require('test');
test.setup();

const path = require('path');
const fibpm = require('../');

function fakeArgs (...args) {
    return [
        process.execPath,
        path.resolve(__dirname, '../bin/fpm.js'),
        ...args
    ]
}

describe("fibpm.npm()", () => {
    let npmCli;
    before(() => {
        npmCli = fibpm.npm();
    });

    it("npmCli.parse", () => {
        npmCli.parse();
    });

    describe("fnpm install", () => {
        it.only("-h, --help", () => {
            const parsed = npmCli.parse(fakeArgs('install', '--help'))
            console.dir(parsed);
        });

        it("[...pkgs]", () => {
            const parsed = npmCli.parse(fakeArgs('install', 'abi'))
            console.dir(parsed);
        });
    });
});

test.run(console.DEBUG);