const test = require('test');
test.setup();

const ssri = require('..')

const tsuites = require('@fibpm/idev-tsuites');

describe("ssri#integrity", () => {
    it('toString()', () => {
        const sri = ssri.parse('sha1-eUN/Xt2hP5wGabl43XqQZt0gWfE= sha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=')
        // 'integrity objects from ssri.parse() can use toString()'
        assert.equal(
            sri.toString(),
            'sha1-eUN/Xt2hP5wGabl43XqQZt0gWfE= sha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=',
        )
        // 'accepts strict mode option'
        assert.equal(
            sri.toString({ strict: true }),
            'sha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=',
        )
        // 'accepts separator option'
        assert.equal(
            sri.toString({ sep: '\n' }),
            'sha1-eUN/Xt2hP5wGabl43XqQZt0gWfE=\nsha256-Qhx213Vjr6GRSEawEL0WTzlb00whAuXpngy5zxc8HYc=',
        )
    })

    it('toJSON()', () => {
        const sri = ssri.parse('sha512-foo sha256-bar!')
        // 'integrity objects from ssri.parse() can use toJSON()'
        assert.equal(
            sri.toJSON(),
            'sha512-foo sha256-bar!',
        )
        // 'hash objects should toJSON also'
        assert.equal(
            sri.sha512[0].toJSON(),
            'sha512-foo',
        )
    })

    it('concat()', () => {
        const sri = ssri.parse('sha512-foo')
        // 'concatenates with a string'
        assert.equal(
            sri.concat('sha512-bar').toString(),
            'sha512-foo sha512-bar',
        )
        // 'concatenates with an Hash-like'
        assert.equal(
            sri.concat({ digest: 'bar', algorithm: 'sha384' }).toString(),
            'sha512-foo sha384-bar',
        )
        // 'concatenates with an Integrity-like'
        assert.equal(
            sri.concat({
                sha384: [{ digest: 'bar', algorithm: 'sha384' }],
                sha1: [{ digest: 'baz', algorithm: 'sha1' }]
            }).toString(),
            'sha512-foo sha384-bar sha1-baz',
        )
        // 'preserves relative order for algorithms between different concatenations'
        assert.equal(
            sri.concat(
                { digest: 'bar', algorithm: 'sha1' }
            ).concat(
                'sha1-baz'
            ).concat(
                'sha512-quux'
            ).toString(),
            'sha512-foo sha512-quux sha1-bar sha1-baz',
        )
        const strictSri = ssri.parse('sha512-WrLorGiX4iEWOOOaJSiCrmDIamA47exH+Bz7tVwIPb4sCU8w4iNqGCqYuspMMeU5pgz/sU7koP5u8W3RCUojGw==')
        // 'accepts strict mode option'
        assert.equal(
            strictSri.concat('sha1-eUN/Xt2hP5wGabl43XqQZt0gWfE=', {
                strict: true
            }).toString(),
            'sha512-WrLorGiX4iEWOOOaJSiCrmDIamA47exH+Bz7tVwIPb4sCU8w4iNqGCqYuspMMeU5pgz/sU7koP5u8W3RCUojGw==',
        )
    })

    it('match()', () => {
        const sri = ssri.parse('sha1-foo sha512-bar')
        // 'returns the matching hash'
        tsuites.Helpers.assertLike(sri.match('sha1-foo'), {
            algorithm: 'sha1',
            digest: 'foo'
        })
        // 'accepts other Integrity objects'
        tsuites.Helpers.assertLike(sri.match(ssri.parse('sha1-foo')), {
            algorithm: 'sha1',
            digest: 'foo'
        })
        // 'accepts other Hash objects'
        tsuites.Helpers.assertLike(sri.match(ssri.parse('sha1-foo')), {
            algorithm: 'sha1',
            digest: 'foo'
        })
        // 'accepts Hash-like objects'
        tsuites.Helpers.assertLike(sri.match({ digest: 'foo', algorithm: 'sha1' }), {
            algorithm: 'sha1',
            digest: 'foo'
        })
        // 'returns the strongest match'
        tsuites.Helpers.assertLike(sri.match('sha1-bar sha512-bar'), {
            algorithm: 'sha512',
            digest: 'bar'
        })
        // 'falsy when match fails'
        assert.notOk(sri.match('sha512-foo'))
        // 'falsy when match fails'
        assert.notOk(sri.match('sha384-foo'))
    })

    it('pickAlgorithm()', () => {
        const sri = ssri.parse('sha1-foo sha512-bar sha384-baz')
        // 'picked best algorithm'
        assert.equal(sri.pickAlgorithm(), 'sha512')
        // 'unrecognized algorithm returned if none others known'
        assert.equal(
            ssri.parse('unknown-deadbeef uncertain-bada55').pickAlgorithm(),
            'unknown',
        )
        // 'custom pickAlgorithm function accepted'
        assert.equal(
            sri.pickAlgorithm({
                pickAlgorithm: (a, b) => 'sha384'
            }),
            'sha384',
        )
        // 'SRIs without algorithms are invalid'
        tsuites.Helpers.assertThrowError(() => {
            ssri.parse('').pickAlgorithm()
        }, /No algorithms available/)
    })

    it('hexDigest()', () => {
        // 'returned hex version of base64 digest'
        assert.equal(
            ssri.parse('sha512-foo').hexDigest(),
            Buffer.from('foo', 'base64').toString('hex'),
        )
        // 'returned hex version of base64 digest'
        assert.equal(
            ssri.parse('sha512-bar', { single: true }).hexDigest(),
            Buffer.from('bar', 'base64').toString('hex'),
        )
    })

    it('isIntegrity and isHash', () => {
        const sri = ssri.parse('sha512-bar')
        // 'full sri has !!.isIntegrity'
        assert.ok(sri.isIntegrity)
        // 'sri hash has !!.isHash'
        assert.ok(
            sri.sha512[0].isHash,
        )
    })

    it('semi-private', () => {
        // 'Integrity class is module-private.'
        assert.strictEqual(ssri.Integrity, undefined)
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
