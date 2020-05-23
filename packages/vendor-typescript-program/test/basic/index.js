const test = require('test');
test.setup();

const path = require('path');

const ts = require('typescript')
const TsProgram = require('../../')
const TEST_DIR = path.resolve(__dirname, '..')

describe("TsProgram", () => {
    it("TsProgram.compile", () => {
        TsProgram.compile(
            [
                path.resolve(TEST_DIR, './basic/ts.dir/index.ts')
            ],
            {
                noEmitOnError: true,
                noImplicitAny: true,
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.CommonJS,
                declaration: true,
                declarationDir: path.resolve(TEST_DIR, './basic/output.dts.dir/'),
                outDir: path.resolve(TEST_DIR, './basic/output.js.dir/'),
            }
        )
        // assert.ok(Mod.default === null)
    });
});

test.run(console.DEBUG);