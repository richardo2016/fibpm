const test = require('test');
test.setup();

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const ssri = require('..')

const tsuites = require('@fibpm/idev-tsuites');

const TEST_DATA = fs.readFileSync(__filename)

function hash(data, algorithm) {
    return crypto.createHash(algorithm).update(data).digest('base64')
}

describe("ssri#merge", () => {
    it('*', () => {
        const i = ssri.parse('sha1-foo')
        const o = ssri.parse('sha512-bar')

        i.merge(o)
        assert.equal(i.toString(), 'sha1-foo sha512-bar', 'added second algo')
        assert.throws(() => i.merge(ssri.parse('sha1-baz')), {
            message: 'hashes do not match, cannot update integrity'
        })
        i.merge(o)
        i.merge(ssri.parse('sha1-foo'))

        // 'did not duplicate'
        assert.equal(i.toString(), 'sha1-foo sha512-bar')
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
}
