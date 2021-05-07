const test = require('test');
test.setup();

const { Readable } = require('stream')
// const t = require('tap')
const http = require('http')

const checkResponse = require('../lib/check-response')
const errors = require('../lib/errors')
const { silentLog, makeAuthMissingLog } = require('../lib/silentlog');
const registry = 'registry'
const startTime = Date.now()

function mockFetchReponse({
    status = 200,
    body = null,
    headers = {},
    url
}) {
    const resp = new http.Response();
    resp.url = url;

    resp.statusCode = status;

    resp.setHeader(headers);

    if (body && typeof body === 'object') {
        resp.body.json(body)
    } else if (body && typeof body === 'string') {
        resp.body.write(body);
    }

    return resp;
}

describe('check-response', () => {
    it('any response error should be silent', () => {
        const res = mockFetchReponse({
            status: 400,
            url: 'https://example.com/',
        });

        let error = null;
        try {
            checkResponse({
                method: 'get',
                res,
                registry,
                startTime,
                opts: {
                    ignoreBody: true,
                },
            })
        } catch (err) {
            error = err;
        }
        assert.ok(error instanceof errors.HttpErrorGeneral);
    })

    it('all checks are ok, nothing to report', () => {
        const res = mockFetchReponse({
            body: 'ok',
            status: 400,
            url: 'https://example.com/',
        });

        let error = null;
        try {
            checkResponse({
                method: 'get',
                res,
                registry,
                startTime,
            })
        } catch (err) {
            error = err;
        }
        assert.ok(error instanceof errors.HttpErrorGeneral);
    })

    it('log x-fetch-attempts header value', () => {
        const headers = {
            'x-fetch-attempts': 3
        }

        const res = mockFetchReponse({
            headers,
            status: 400,
        });
        // t.plan(2)

        let logged = false;
        let error = null;
        try {
            checkResponse({
                method: 'get',
                res,
                registry,
                startTime,
                opts: {
                    log: Object.assign({}, silentLog, {
                        http(header, msg) {
                            logged = true;
                            assert.ok(msg.endsWith('attempt #3'), 'should log correct number of attempts')
                        },
                    }),
                },
            })
        } catch (err) {
            error = err;
        }
        assert.ok(error instanceof Error);
        assert.isTrue(logged);
    })

    it('log the url fetched', () => {
        const headers = {}
        const res = mockFetchReponse({
            headers,
            status: 200,
            url: 'http://example.com/foo/bar/baz',
        });
        //   t.plan(2)

        let logged = false;

        checkResponse({
            method: 'get',
            res,
            registry,
            startTime,
            opts: {
                log: Object.assign({}, silentLog, {
                    http(header, msg) {
                        logged = true;
                        assert.equal(header, 'fetch')
                        assert.isTrue(/^GET 200 http:\/\/example.com\/foo\/bar\/baz [0-9]+m?s/.test(msg))
                    },
                }),
            },
        })

        assert.isTrue(logged);
    })

    it('redact password from log', () => {
        const headers = {}
        const res = mockFetchReponse({
            headers,
            status: 200,
            url: 'http://username:password@example.com/foo/bar/baz',
        });

        let logged = false;
        //   t.plan(2)
        checkResponse({
            method: 'get',
            res,
            registry,
            startTime,
            opts: {
                log: Object.assign({}, silentLog, {
                    http(header, msg) {
                        logged = true
                        assert.equal(header, 'fetch')
                        assert.isTrue(/^GET 200 http:\/\/username:\*\*\*@example.com\/foo\/bar\/baz [0-9]+m?s/.test(msg))
                    },
                }),
            },
        })
        assert.isTrue(logged);
    })

    it('bad-formatted warning headers', () => {
        const headers = {
            'warning': ['100 - foo']
        }
        const res = mockFetchReponse({
            headers
        });

        let logged = false;

        checkResponse({
            method: 'get',
            res,
            registry,
            startTime,
            opts: {
                log: Object.assign({}, silentLog, {
                    warn(header, msg) {
                        // 'should not log warnings'
                        logged = true;
                    },
                }),
            },
        })

        assert.isFalse(logged);
    })

    it('report auth for registry, but not for this request', () => {
        const res = mockFetchReponse({
            body: 'ok',
            status: 400,
            url: 'https://example.com/',
        });

        let logged = false;
        let error = null;
        try {
            checkResponse({
                method: 'get',
                res,
                uri: 'https://example.com/',
                registry,
                startTime,
                auth: {
                    scopeAuthKey: '//some-scope-registry.com/',
                    auth: null,
                    token: null,
                },
                opts: {
                    log: Object.assign({}, silentLog, {
                        warn(header, msg) {
                            logged = true;
                            assert.equal(header, 'registry')
                            assert.equal(msg, makeAuthMissingLog('https://example.com/', '//some-scope-registry.com/'))
                        },
                    }),
                },
            })
        } catch (err) {
            error = err;
        }

        assert.isTrue(logged);
        assert.isTrue(error instanceof errors.HttpErrorGeneral)
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}