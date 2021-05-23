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

describe("ssri#parse", () => {
    it('parses single-entry integrity string', () => {
        const sha = hash(TEST_DATA, 'sha512')
        const integrity = `sha512-${sha}`

        // 'single entry parsed into full Integrity instance'
        assert.deepEqual(ssri.parse(integrity), {
            sha512: [{
                source: integrity,
                digest: sha,
                algorithm: 'sha512',
                options: []
            }]
        })
    })

    it('parses options from integrity string', () => {
        const sha = hash(TEST_DATA, 'sha512')
        const integrity = `sha512-${sha}?one?two?three`

        // 'single entry parsed into full Integrity instance'
        assert.deepEqual(ssri.parse(integrity), {
            sha512: [{
                source: integrity,
                digest: sha,
                algorithm: 'sha512',
                options: ['one', 'two', 'three']
            }]
        })
    })

    it('parses options from integrity string in strict mode', () => {
        const sha = hash(TEST_DATA, 'sha512')
        const integrity = `sha512-${sha}?one?two?three`

        // 'single entry parsed into full Integrity instance'
        assert.deepEqual(ssri.parse(integrity, { strict: true }), {
            sha512: [{
                source: integrity,
                digest: sha,
                algorithm: 'sha512',
                options: ['one', 'two', 'three']
            }]
        })
    })

    it('can parse single-entry string directly into Hash', () => {
        const sha = hash(TEST_DATA, 'sha512')
        const integrity = `sha512-${sha}`

        // 'single entry parsed into single Hash instance'
        assert.deepEqual(ssri.parse(integrity, { single: true }), {
            source: integrity,
            digest: sha,
            algorithm: 'sha512',
            options: []
        })
    })

    it('accepts Hash-likes as input', () => {
        const algorithm = 'sha512'
        const digest = hash(TEST_DATA, 'sha512')
        const sriLike = {
            algorithm,
            digest,
            options: ['foo']
        }
        const parsed = ssri.parse(sriLike)

        // 'Metadata-like returned as full Integrity instance'
        assert.deepEqual(parsed, {
            sha512: [{
                source: `sha512-${digest}?foo`,
                algorithm,
                digest,
                options: ['foo']
            }]
        })
    })

    it('omits unsupported algos in strict mode only', () => {
        const hash = new Array(50).join('x')

        tsuites.Helpers.assertLike(ssri.parse(`foo-${hash}`, {
            strict: true,
            single: true
        }), {
            source: `foo-${hash}`,
            algorithm: '',
            digest: '',
            options: []
        })

        tsuites.Helpers.assertLike(ssri.parse(`foo-${hash}`, {
            strict: false,
            single: true
        }), {
            source: `foo-${hash}`,
            algorithm: 'foo',
            digest: hash,
            options: []
        })

        tsuites.Helpers.assertLike(ssri.parse(`sha512-${hash}`, {
            strict: true,
            single: true
        }), {
            source: `sha512-${hash}`,
            algorithm: 'sha512',
            digest: hash,
            options: []
        })
    })

    it('use " " as sep when opts.sep is falsey', () => {
        const hash = ssri.parse('yum-somehash foo-barbaz')
        assert.equal(hash.toString({ sep: false }), 'yum-somehash foo-barbaz')
        assert.equal(hash.toString({ sep: '\t' }), 'yum-somehash\tfoo-barbaz')
    })

    it('accepts Integrity-like as input', () => {
        const algorithm = 'sha512'
        const digest = hash(TEST_DATA, 'sha512')
        const sriLike = {
            sha512: [{
                algorithm,
                digest,
                options: ['foo']
            }]
        }
        const parsed = ssri.parse(sriLike)
        // 'Integrity-like returned as full Integrity instance'
        assert.deepEqual(parsed, {
            sha512: [{
                source: `sha512-${digest}?foo`,
                algorithm,
                digest,
                options: ['foo']
            }]
        })
        // 'Objects are separate instances.'
        assert.notEqual(parsed, sriLike)
    })

    it('parses and groups multiple-entry strings', () => {
        const hashes = [
            `sha1-${hash(TEST_DATA, 'sha1')}`,
            `sha256-${hash(TEST_DATA, 'sha256')}`,
            'sha1-OthERhaSh',
            'unknown-WoWoWoWoW'
        ]
        assert.deepEqual(ssri.parse(hashes.join(' ')), {
            sha1: [{
                source: hashes[0],
                digest: hashes[0].split('-')[1],
                algorithm: 'sha1',
                options: []
            }, {
                source: hashes[2],
                digest: hashes[2].split('-')[1],
                algorithm: 'sha1',
                options: []
            }],
            sha256: [{
                source: hashes[1],
                digest: hashes[1].split('-')[1],
                algorithm: 'sha256',
                options: []
            }],
            unknown: [{
                source: hashes[3],
                digest: hashes[3].split('-')[1],
                algorithm: 'unknown',
                options: []
            }]
        })
    })

    it('parses any whitespace as entry separators', () => {
        const integrity = '\tsha512-foobarbaz \n\rsha384-bazbarfoo\n         \t  \t\t sha256-foo'
        // 'whitespace around metadata skipped and trimmed'
        assert.deepEqual(ssri.parse(integrity), {
            sha512: [{
                source: 'sha512-foobarbaz',
                algorithm: 'sha512',
                digest: 'foobarbaz',
                options: []
            }],
            sha384: [{
                source: 'sha384-bazbarfoo',
                algorithm: 'sha384',
                digest: 'bazbarfoo',
                options: []
            }],
            sha256: [{
                source: 'sha256-foo',
                algorithm: 'sha256',
                digest: 'foo',
                options: []
            }]
        })
    })

    it('discards invalid format entries', () => {
        const missingDash = 'thisisbad'
        const missingAlgorithm = '-deadbeef'
        const missingDigest = 'sha512-'
        const valid = `sha512-${hash(TEST_DATA, 'sha512')}`
        // 'invalid entries thrown out'
        assert.equal(ssri.parse([
            missingDash,
            missingAlgorithm,
            missingDigest,
            valid
        ].join(' ')).toString(), valid)
    })

    it('trims whitespace from either end', () => {
        const integrity = `      sha512-${hash(TEST_DATA, 'sha512')}    `
        // 'whitespace is trimmed from source before parsing'
        assert.deepEqual(ssri.parse(integrity), {
            sha512: [{
                source: integrity.trim(),
                algorithm: 'sha512',
                digest: hash(TEST_DATA, 'sha512'),
                options: []
            }]
        })
    })

    // 'entries that fail strict check rejected'
    it('supports strict spec parsing', () => {
        const valid = `sha512-${hash(TEST_DATA, 'sha512')}`
        const badAlgorithm = `sha1-${hash(TEST_DATA, 'sha1')}`
        const badBase64 = 'sha512-@#$@%#$'
        const badOpts = `${valid}?\x01\x02`
        assert.deepEqual(ssri.parse([
            badAlgorithm,
            badBase64,
            badOpts,
            valid
        ].join(' '), {
            strict: true
        }).toString(), valid)
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
