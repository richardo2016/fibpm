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

describe("ssri#check*", () => {
    it('checkData', () => {
        const sri = ssri.parse({
            algorithm: 'sha512',
            digest: hash(TEST_DATA, 'sha512')
        })
        const meta = sri['sha512'][0]
        assert.deepEqual(
            ssri.checkData(TEST_DATA, sri),
            meta,
            'Buffer data successfully verified'
        )
        tsuites.Helpers.doesNotThrow(() => {
            ssri.checkData(TEST_DATA, sri, { error: true })
        }, 'error not thrown when error: true and data verifies')
        assert.deepEqual(
            ssri.checkData(TEST_DATA, `sha512-${hash(TEST_DATA, 'sha512')}`),
            meta,
            'Accepts string SRI'
        )
        assert.deepEqual(
            ssri.checkData(TEST_DATA, {
                algorithm: 'sha512',
                digest: hash(TEST_DATA, 'sha512')
            }),
            meta,
            'Accepts Hash-like SRI'
        )
        assert.deepEqual(
            ssri.checkData(TEST_DATA.toString('utf8'), sri),
            meta,
            'String data successfully verified'
        )
        assert.deepEqual(
            ssri.checkData(
                TEST_DATA,
                `sha512-nope sha512-${hash(TEST_DATA, 'sha512')}`
            ),
            meta,
            'succeeds if any of the hashes under the chosen algorithm match'
        )
        assert.equal(
            ssri.checkData('nope', sri),
            false,
            'returns false when verification fails'
        )
        
        tsuites.Helpers.assertThrowError(() => {
            ssri.checkData('nope', sri, { error: true })
        }, /Integrity checksum failed/, 'integrity error thrown when error: true with bad data')

        tsuites.Helpers.assertThrowError(() => {
            ssri.checkData('nope', sri, { error: true, size: 3 })
        }, /data size mismatch/, 'size error thrown when error: true with bad size')
        assert.equal(
            ssri.checkData('nope', 'sha512-nope'),
            false,
            'returns false on invalid sri hash'
        )
        assert.equal(
            ssri.checkData('nope', 'garbage'),
            false,
            'returns false on garbage sri input'
        )
        assert.equal(
            ssri.checkData('nope', ''),
            false,
            'returns false on empty sri input'
        )
        tsuites.Helpers.assertThrowError(() => {
            ssri.checkData('nope', '', { error: true })
        }, /No valid integrity hashes/, 'errors on empty sri input if error: true')
        assert.deepEqual(
            ssri.checkData(TEST_DATA, [
                'sha512-nope',
                `sha1-${hash(TEST_DATA, 'sha1')}`,
                `sha512-${hash(TEST_DATA, 'sha512')}`
            ].join(' '), {
                pickAlgorithm: (a, b) => {
                    if (a === 'sha1' || b === 'sha1') { return 'sha1' }
                }
            }),
            ssri.parse({
                algorithm: 'sha1', digest: hash(TEST_DATA, 'sha1')
            })['sha1'][0],
            'opts.pickAlgorithm can be used to customize which one is used.'
        )
        assert.deepEqual(
            ssri.checkData(TEST_DATA, [
                `sha1-${hash(TEST_DATA, 'sha1')}`,
                `sha384-${hash(TEST_DATA, 'sha384')}`,
                `sha256-${hash(TEST_DATA, 'sha256')}`
            ].join(' ')),
            ssri.parse({
                algorithm: 'sha384', digest: hash(TEST_DATA, 'sha384')
            })['sha384'][0],
            'picks the "strongest" available algorithm, by default'
        )
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
