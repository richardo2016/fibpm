const test = require('test');
test.setup();

const fs = require('fs');
const path = require('path');

const ts = require('typescript')
const TsProgram = require('../../')
const UnitTestDir = path.resolve(__dirname, '.')

describe('TsProgram.compile - single entry', () => {
    it("just compile", () => {
        const emitResult = TsProgram.compile(
            [
                path.resolve(UnitTestDir, './just-compile/ts.dir/index.ts')
            ],
            {
                noEmit: true,
                noEmitOnError: true,
                noImplicitAny: true,
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.CommonJS,
            }
        )

        assert.notOk(
            fs.exists(path.resolve(UnitTestDir, './just-compile/output.js.dir/index.js'))
        )

        assert.notOk(
            fs.exists(path.resolve(UnitTestDir, './just-compile/output.dts.dir/index.d.ts'))
        )

        assert.ok(process.exitCode === 0)
        assert.ok(emitResult.emitSkipped)
    });

    it("emit declaration", () => {
        TsProgram.compile(
            [
                path.resolve(UnitTestDir, './emit-declartion/ts.dir/index.ts')
            ],
            {
                noEmitOnError: true,
                noImplicitAny: true,
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.CommonJS,
                declaration: true,
                declarationDir: path.resolve(UnitTestDir, './emit-declartion/output.dts.dir/'),
                outDir: path.resolve(UnitTestDir, './emit-declartion/output.js.dir/'),
            }
        )

        assert.ok(
            fs.exists(path.resolve(UnitTestDir, './emit-declartion/output.js.dir/index.js'))
        )

        assert.ok(
            fs.exists(path.resolve(UnitTestDir, './emit-declartion/output.dts.dir/index.d.ts'))
        )
    });
});

require.main === module && test.run(console.DEBUG);