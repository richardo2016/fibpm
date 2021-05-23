const test = require('test');
test.setup();

const ssri = require('..')

const tsuites = require('@fibpm/idev-tsuites');

describe("ssri#create*", () => {
    it('works just like from', function () {
        const integrity = ssri.fromData('hi')
        const integrityCreate = ssri.create().update('hi').digest()

        // should be same Integrity that fromData returns
        assert.ok(integrityCreate instanceof integrity.constructor)
        // should be the sam as fromData
        assert.equal(integrity + '', integrityCreate + '')
    })

    it('pass in an algo multiple times', () => {
        tsuites.Helpers.assertLike(ssri.fromData('hi', {
            algorithms: ['sha512', 'sha512']
        }), {
            sha512: [
                {
                    source: 'sha512-FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    digest: 'FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    algorithm: 'sha512',
                    options: []
                },
                {
                    source: 'sha512-FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    digest: 'FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    algorithm: 'sha512',
                    options: []
                }
            ]
        })

        // not same with the original but make sense
        tsuites.Helpers.assertLike(ssri.create({
            options: ['foo=bar', 'baz=quux'],
            algorithms: ['sha512', 'sha512'],
        }).update('hi').digest(), {
            sha512: [
                {
                    source: 'sha512-FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==?foo=bar?baz=quux',
                    digest: 'FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    algorithm: 'sha512',
                    options: ['foo=bar', 'baz=quux']
                },
                {
                    source: 'sha512-FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==?foo=bar?baz=quux',
                    digest: 'FQoU7VvqbMcxz4bEFWasQnqNtI7xuf1iZmSzv7uZBx+kySLzPd44cZuMg1Tit6udd+Dmf8EoQ5IKcS5z1Vjhlw==',
                    algorithm: 'sha512',
                    options: ['foo=bar', 'baz=quux']
                }
            ]
        })
    })

    it('can pass options', function () {
        const integrity = ssri.create({ algorithms: ['sha256', 'sha384'] }).update('hi').digest()

        assert.equal(
            integrity + '',
            'sha256-j0NDRmSPa5bfid2pAcUXaxCm2Dlh3TwayItZstwyeqQ= ' +
            'sha384-B5EAbfgShHckT1PQ/c4hDbgfVXV1EOJqzuNcGKa86qKNzbv9bcBBubTcextU439S',
            'should be expected value'
        )
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
