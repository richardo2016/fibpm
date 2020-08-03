const test = require('test');
test.setup();

const fibpm = require('../');

const {
    readFromFpmCommand,
    runFpmCommnd,
    readHelpOutput
} = require('./utils');

const pkgjson = require('../package.json');

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
            assert.deepEqual(
                readFromFpmCommand('install', '--help'),
                readHelpOutput('install', {
                    VERSION: pkgjson.version
                })
            )
        });

        it("[...pkgs]", () => {
            readFromFpmCommand('install', 'abi');
        });
    });

    describe("fnpm run", () => {
        it.only("-h, --help", () => {
            assert.deepEqual(
                readFromFpmCommand('run', '--help'),
                readHelpOutput('run', {
                    VERSION: pkgjson.version
                })
            )
        });
    });

    describe("fnpm search", () => {
        it("-h, --help", () => {
            assert.deepEqual(
                readFromFpmCommand('search', '--help'),
                readHelpOutput('search', {
                    VERSION: pkgjson.version
                })
            )
        });

        it("search [abi]", () => {
            runFpmCommnd('search', 'abi');
        });
        
        it("search [fib-typify]", () => {
            runFpmCommnd('search', 'fib-typify');
        });

        it("search not-existed", () => {
            const notExisted = `lalalalalxxxxxxalala-${Date.now()}`
            assert.deepEqual(
                readFromFpmCommand('search', notExisted),
                `No matches found for "${notExisted}"`
            )
        });
    });
});

// require('./examples.js')

test.run(console.DEBUG);