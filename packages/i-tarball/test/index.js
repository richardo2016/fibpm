const test = require('test');
test.setup();

const fs = require('fs');
const path = require('path');

const {
    ensureDirectoryExisted,
    getArchiveRootName,
    untar,
    extractTarLocalFiles
} = require('../');

const tmpDir = path.resolve(__dirname, './tmp');
ensureDirectoryExisted(tmpDir);

describe("tgz", () => {
    it("basic", () => {
        assert.isFunction(getArchiveRootName)
        assert.isFunction(untar)
        assert.isFunction(extractTarLocalFiles)
    });

    describe("unzip one tar.gz", () => {
        let tarLocalFiles;
        let archiveRootName
        before(() => {
            const ipt = path.resolve(__dirname, './input/fib-typify-0.0.1.tgz');
            tarLocalFiles = untar(fs.readFile(ipt))

            archiveRootName = getArchiveRootName(tarLocalFiles)
        });

        it("untar", () => {
            assert.isArray(tarLocalFiles)
        });

        it("getArchiveRootName", () => {
            assert.equal(archiveRootName, 'package')
        });

        it("extractTarLocalFiles", () => {
            const dest = path.resolve(tmpDir, './fib-typify-0.0.1')
            try {
                fs.unlink(dest)
                assert.ok(!fs.exists(dest))
            } catch (error) {}

            extractTarLocalFiles(tarLocalFiles, dest)

            tarLocalFiles.forEach(file => {
                const relpath = file.filename.slice(archiveRootName.length);

                if (!relpath) return;

                const uncompressedPath = path.join(dest, relpath);
                assert.ok(fs.exists(uncompressedPath))
            })
        });
    });
});

test.run(console.DEBUG);