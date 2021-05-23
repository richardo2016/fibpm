const test = require('test');
test.setup();

const crypto = require('crypto')
const fs = require('fs')

const ssri = require('..')

const TEST_DATA = fs.readFileSync(__filename)

function hash(data, algorithm) {
    return crypto.createHash(algorithm).update(data).digest('base64')
}

describe("ssri#from*", () => {
    it('fromHex', () => {
        // created an Integrity object from a given hex + sha
        assert.equal(
            ssri.fromHex('deadbeef', 'sha1').toString(),
            'sha1-3q2+7w==',
        )
        // options added to entry
        assert.equal(
            ssri.fromHex('deadbeef', 'sha512', { options: ['a', 'b', 'c'] }).toString(),
            'sha512-3q2+7w==?a?b?c',
        )
    })

    it('fromData', () => {
        // 'generates sha512 integrity object from Buffer data'
        assert.equal(
            ssri.fromData(TEST_DATA).toString(),
            `sha512-${hash(TEST_DATA, 'sha512')}`
        )
        // 'generates sha512 integrity object from String data'
        assert.equal(
            ssri.fromData(TEST_DATA.toString('utf8')).toString(),
            `sha512-${hash(TEST_DATA, 'sha512')}`
        )
        // 'can generate multiple metadata entries with opts.algorithms'
        assert.equal(
            ssri.fromData(TEST_DATA, { algorithms: ['sha256', 'sha384'] }).toString(),
            `sha256-${hash(TEST_DATA, 'sha256')} sha384-${hash(TEST_DATA, 'sha384')}`
        )
        // 'can add opts.options to each entry'
        assert.equal(
            ssri.fromData(TEST_DATA, {
                algorithms: ['sha256', 'sha384'],
                options: ['foo', 'bar']
            }).toString(), [
                `sha256-${hash(TEST_DATA, 'sha256')}?foo?bar`,
                `sha384-${hash(TEST_DATA, 'sha384')}?foo?bar`
            ].join(' '),
        )
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
