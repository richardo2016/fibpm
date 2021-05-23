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

describe("ssri#stringify", () => {
    it('serializes Integrity-likes', () => {
        const sriLike = {
            sha512: [{
                digest: 'foo',
                algorithm: 'sha512',
                options: ['ayy', 'woo']
            }, {
                digest: 'bar',
                algorithm: 'sha512'
            }],
            whirlpool: [{
                digest: 'wut',
                algorithm: 'whirlpool'
            }]
        }
        // 'stringification contains correct data for all entries'
        assert.equal(
            ssri.stringify(sriLike),
            'sha512-foo?ayy?woo sha512-bar whirlpool-wut'
        )
    })

    it('serializes Hash-likes', () => {
        const sriLike = {
            digest: 'foo',
            algorithm: 'sha512'
        }

        // 'serialization has correct data'
        assert.equal(
            ssri.stringify(sriLike),
            'sha512-foo'
        )
    })

    it('serialized plain strings into a valid parsed version', () => {
        const sri = ' \tsha512-foo?bar    \n\n\nsha1-nope\r'

        // 'cleaned-up string with identical contents generated'
        assert.equal(
            ssri.stringify(sri),
            'sha512-foo?bar sha1-nope',
        )
    })

    it('accepts a separator opt', () => {
        const sriLike = {
            sha512: [{
                algorithm: 'sha512',
                digest: 'foo'
            }, {
                algorithm: 'sha512',
                digest: 'bar'
            }]
        }
        assert.equal(
            ssri.stringify(sriLike, { sep: '\n' }),
            'sha512-foo\nsha512-bar'
        )
        assert.equal(
            ssri.stringify(sriLike, { sep: ' | ' }),
            'sha512-foo | sha512-bar'
        )
    })

    it('support strict serialization', () => {
        const sriLike = {
            // only sha256, sha384, and sha512 are allowed by the spec
            sha1: [{
                algorithm: 'sha1',
                digest: 'feh'
            }],
            sha256: [{
                algorithm: 'sha256',
                // Must be valid base64
                digest: 'wut!!!??!!??!'
            }, {
                algorithm: 'sha256',
                digest: hash(TEST_DATA, 'sha256'),
                options: ['foo']
            }],
            sha512: [{
                algorithm: 'sha512',
                digest: hash(TEST_DATA, 'sha512'),
                // Options must use VCHAR
                options: ['\x01']
            }]
        }

        // 'entries that do not conform to strict spec interpretation removed'
        assert.equal(
            ssri.stringify(sriLike, { strict: true }),
            `sha256-${hash(TEST_DATA, 'sha256')}?foo`,
        )
        // 'strict mode replaces non-whitespace characters in separator with space'
        assert.equal(
            ssri.stringify('sha512-WrLorGiX4iEWOOOaJSiCrmDIamA47exH+Bz7tVwIPb4sCU8w4iNqGCqYuspMMeU5pgz/sU7koP5u8W3RCUojGw== sha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=', { sep: ' \r|\n\t', strict: true }),
            'sha512-WrLorGiX4iEWOOOaJSiCrmDIamA47exH+Bz7tVwIPb4sCU8w4iNqGCqYuspMMeU5pgz/sU7koP5u8W3RCUojGw== \r \n\tsha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=',
        )
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
