const test = require('test');
test.setup();

const npa = require('npm-package-arg')
const { nock } = require('../lib/mock-server');
const errors = require('../lib/errors.js')
const { mockLog } = require('../lib/silentlog');

const fetch = require('../')

// npmlog.level = process.env.LOGLEVEL || 'silent'
const OPTS = {
    log: mockLog,
    timeout: 0,
    // retry: {
    //     retries: 1,
    //     factor: 1,
    //     minTimeout: 1,
    //     maxTimeout: 10,
    // },
    registry: 'https://mock.reg/',
}

describe('errors', () => {
    it('generic request errors', () => {
        const ms = nock(OPTS.registry)
            .get('/ohno/oops')
            .reply(400, 'failwhale!', {}, { json: false })
            
        // verify that the otpPrompt won't save from non-OTP errors
        const otpPrompt = () => {
            throw new Error('nope')
        }
        try {
            fetch.mock('/ohno/oops', { ...OPTS, otpPrompt }, req => {
                ms.receive(req)
            });
        } catch (err) {
            assert.equal(
                err.message,
                `400 Bad Request - GET ${OPTS.registry}ohno/oops`,
            )
            assert.equal(err.code, 'E400')
            assert.equal(err.statusCode, 400)
            assert.equal(err.method, 'GET')
            assert.equal(err.body.toString('utf8'), 'failwhale!')
            assert.equal(err.pkgid, 'oops')

        }
    })

    it('pkgid tie fighter', () => {
        const ms = nock(OPTS.registry)
            .get('/-/ohno/_rewrite/ohyeah/maybe')
            .reply(400, 'failwhale!')

        try {
            fetch.mock('/-/ohno/_rewrite/ohyeah/maybe', OPTS, req => ms.receive(req))
        } catch (err) {
            assert.equal(err.pkgid, undefined, 'no pkgid on tie fighters')
        }
    })

    it('pkgid _rewrite', () => {
        const ms = nock(OPTS.registry)
            .get('/ohno/_rewrite/ohyeah/maybe')
            .reply(400, 'failwhale!')

        try {
            fetch.mock('/ohno/_rewrite/ohyeah/maybe', OPTS, req => ms.receive(req))
        } catch (err) {
            assert.equal(err.pkgid, 'ohyeah')
        }
    })

    it('pkgid with `opts.spec`', () => {
        const ms = nock(OPTS.registry)
            .get('/ohno/_rewrite/ohyeah')
            .reply(400, 'failwhale!')

        try {
            fetch.mock('/ohno/_rewrite/ohyeah', {
                ...OPTS,
                spec: npa('foo@1.2.3'),
            }, req => ms.receive(req))
        } catch (err) {
            assert.equal(err.pkgid, 'foo@1.2.3', 'opts.spec used for pkgid')
        }
    })

    it('JSON error reporing', () => {
        const ms = nock(OPTS.registry)
            .get('/ohno')
            .reply(400, { error: 'badarg' })

        try {
            fetch('/ohno', OPTS, req => ms.receive(req))
        } catch (err) {
            assert.equal(
                err.message,
                `400 Bad Request - GET ${OPTS.registry}ohno - badarg`,
                'neatly printed message'
            )
            assert.equal(err.code, 'E400', 'HTTP code used for err.code')
            assert.equal(err.statusCode, 400, 'numerical HTTP code available')
            assert.equal(err.method, 'GET', 'method in error object')
            assert.deepEqual(err.body, {
                error: 'badarg',
            })
        }
    })

    it('OTP error', () => {
        const ms = nock(OPTS.registry)
            .get('/otplease')
            .reply(401, { error: 'needs an otp, please' }, {
                'www-authenticate': 'otp',
            })

        try {
            fetch.mock('/otplease', OPTS, req => ms.receive(req))
        } catch (err) {
            assert.equal(err.code, 'EOTP')
        }
    })

    it('OTP error with prompt', () => {
        let OTP = null
        const ms = nock(OPTS.registry)
            .get('/otplease')
            // .times(2)
            .matchHeader('npm-otp', otp => {
                if (otp) {
                    OTP = otp[0]
                    assert.deepEqual(otp, ['12345'])
                }
                return true
            })
            .reply((...args) => {
                if (OTP === '12345')
                    return [200, { ok: 'this is fine' }, {}]
                else
                    return [401, { error: 'otp, please' }, { 'www-authenticate': 'otp' }]
            })

        const otpPrompt = () => '12345'

        const res = fetch.mock('/otplease', { ...OPTS, otpPrompt }, req => ms.receive(req))
        assert.strictEqual(res.statusCode, 200, 'got 200 response')

        const body = res.json();
        assert.deepEqual(body, { ok: 'this is fine' })
    })

    it('OTP error with prompt, expired OTP in settings', () => {
        let OTP = null
        const ms = nock(OPTS.registry)
            .get('/otplease')
            // .times(2)
            .matchHeader('npm-otp', otp => {
                if (otp) {
                    if (!OTP)
                        assert.deepEqual(otp, ['98765'], 'got invalid otp first')
                    else
                        assert.deepEqual(otp, ['12345'], 'got expected otp')
                    OTP = otp[0]
                }
                return true
            })
            .reply((...args) => {
                if (OTP === '12345')
                    return [200, { ok: 'this is fine' }, {}]
                else
                    return [401, { error: 'otp, please' }, { 'www-authenticate': 'otp' }]
            })

        const otpPrompt = () => '12345'
        const res = fetch('/otplease', { ...OPTS, otpPrompt, otp: '98765' }, req => ms.receive(req))
        assert.strictEqual(res.statusCode, 200)

        const body = res.json();
        assert.deepEqual(body, { ok: 'this is fine' }, 'got expected body')
    })

    it('OTP error with prompt that fails', () => {
        const ms = nock(OPTS.registry)
            .get('/otplease')
            .reply((...args) => {
                return [401, { error: 'otp, please' }, { 'www-authenticate': 'otp' }]
            })

        const otpPrompt = () => {
            // throw new Error('whoopsie')
        }

        try {
            fetch.mock('/otplease', { ...OPTS, otpPrompt }, ms)
        } catch (err) {
            assert.ok(err instanceof errors.HttpErrorAuthOTP);
        }
    })

    it('OTP error with prompt that returns nothing', () => {
        const ms = nock(OPTS.registry)
            .get('/otplease')
            .reply((...args) => {
                return [401, { error: 'otp, please' }, { 'www-authenticate': 'otp' }]
            })

        const otpPrompt = () => { }

        try {
            fetch.mock('/otplease', { ...OPTS, otpPrompt }, ms)
        } catch (err) {
            assert.ok(err instanceof errors.HttpErrorAuthOTP);
        }
    })

    it('OTP error when missing www-authenticate', () => {
        const ms = nock(OPTS.registry)
            .get('/otplease')
            .reply(401, { error: 'needs a one-time password' })

        try {
            fetch.mock('/otplease', OPTS, ms)
        } catch (err) {
            assert.equal(err.code, 'EOTP', 'got special OTP error code even with missing www-authenticate header')
        }
    })

    it('Bad IP address error', () => {
        const ms = nock(OPTS.registry)
            .get('/badaddr')
            .reply(401, { error: 'you are using the wrong IP address, friend' }, {
                'www-authenticate': 'ipaddress',
            })

        try {
            fetch.mock('/badaddr', OPTS, ms)
        } catch (err) {
            assert.equal(err.code, 'EAUTHIP', 'got special OTP error code')
        }
    })

    it('Unexpected www-authenticate error', () => {
        const ms = nock(OPTS.registry)
            .get('/unown')
            .reply(401, {
                error: `
        Pat-a-cake, pat-a-cake, baker's man.
        Bake me a cake as fast as you can
        Pat it, and prick it, and mark it with a "B"
        And put it in the oven for baby and me!
      `,
            }, {
                'www-authenticate': 'pattie-cake-protocol',
            })

        try {
            fetch.mock('/unown', OPTS, ms)
        } catch (err) {
            assert.isTrue(/Pat-a-cake/ig.test(err.body.error), 'error body explains it')
            assert.equal(err.code, 'E401', 'Unknown auth errors are generic 401s')
        }
    })
})

if (require.main === module) {
    test.run(console.DEBUG);
}