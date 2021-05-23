const test = require('test');
test.setup();

const ssri = require('../')

const data = 'hello world'
const expectIntegrity = ssri.fromData(data, { algorithms: ['sha512'] })
const expectSize = data.length

const tsuites = require('@fibpm/idev-tsuites');

describe("ssri#checkData", () => {
    it('sri from ssri.parse', () => {
        const sri0 = ssri.parse('sha512-deepbeets');

        const err = tsuites.Helpers.runAndReturnError(() => {
            ssri.checkData(data, sri0, { error: true })
        });

        assert.equal(err.code, 'EINTEGRITY');
    })

    it('integrity string', () => {
        const integrity = 'sha512-deepbeets';

        const err = tsuites.Helpers.runAndReturnError(() => {
            ssri.checkData(data, integrity, { error: true })
        });

        assert.equal(err.code, 'EINTEGRITY');
    })

    it('bad size', () => {
        const sri = ssri.create().update('hi').digest();

        const err = tsuites.Helpers.runAndReturnError(() => {
            ssri.checkData(data, sri, { error: true, size: 2 })
        });

        assert.equal(err.code, 'EBADSIZE');
    })

    it('good integrity', () => {
        const sri0 = ssri.create().update(data).digest();
        const match = ssri.checkData(data, sri0, { integrity: expectIntegrity })

        assert.isTrue(!!match);
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}
