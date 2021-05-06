const test = require('test');
test.setup();

const getAuth = require('../lib/auth').default;

const { nock } = require('../lib/mock-server');
const fetch = require('../lib');
const { mockLog } = require('../lib/slilent-log');

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

describe("getAuth", () => {
    it('basic auth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            username: 'globaluser',
            password: Buffer.from('globalpass', 'utf8').toString('base64'),
            email: 'global@ma.il',
            '//my.custom.registry/here/:username': 'user',
            '//my.custom.registry/here/:_password': Buffer.from('pass', 'utf8').toString('base64'),
            '//my.custom.registry/here/:email': 'e@ma.il',
        }
        const gotAuth = getAuth(config.registry, config)
        assert.deepEqual(gotAuth, {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: true,
            auth: Buffer.from('user:pass').toString('base64'),
        }, 'basic auth details generated')

        const opts = Object.assign({}, OPTS, config)
        const encoded = Buffer.from('user:pass', 'utf8').toString('base64')

        const ms = nock(config.registry)
            .matchHeader('authorization', auth => {
                assert.equal(auth[0], `Basic ${encoded}`)
                return auth[0] === `Basic ${encoded}`
            })
            .get('/hello')
            .reply(200, '"success"')
            
        const body = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(body, 'success');
    })

    it('token auth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            token: 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
            '//my.custom.registry/:_authToken': 'c0ffee',
            '//my.custom.registry/:token': 'nope',
        }
        assert.deepEqual(getAuth(`${config.registry}/foo/-/foo.tgz`, config), {
            scopeAuthKey: null,
            isBasicAuth: false,
            token: 'c0ffee',
            auth: null,
        }, 'correct auth token picked out')

        const opts = Object.assign({}, OPTS, config)
        const ms = nock(opts.registry)
            .matchHeader('authorization', auth => {
                assert.equal(auth[0], 'Bearer c0ffee', 'got correct bearer token')
                return auth[0] === 'Bearer c0ffee'
            })
            .get('/hello')
            .reply(200, '"success"')

        const res = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(res, 'success');
    })

    it('forceAuth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            token: 'deadbeef',
            'always-auth': false,
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
            forceAuth: {
                username: 'user',
                password: Buffer.from('pass', 'utf8').toString('base64'),
                email: 'e@ma.il',
                'always-auth': true,
            },
        }
        assert.deepEqual(getAuth(config.registry, config), {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: true,
            auth: Buffer.from('user:pass').toString('base64'),
        }, 'only forceAuth details included')

        const opts = Object.assign({}, OPTS, config)
        const encoded = Buffer.from('user:pass', 'utf8').toString('base64')

        const ms = nock(opts.registry)
            .matchHeader('authorization', auth => {
                assert.equal(auth[0], `Basic ${encoded}`, 'got encoded basic auth')
                return auth[0] === `Basic ${encoded}`
            })
            .get('/hello')
            .reply(200, '"success"')
        
        const res = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(res, 'success')
    })

    it('_auth auth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            _auth: 'deadbeef',
            '//my.custom.registry/:_auth': 'decafbad',
            '//my.custom.registry/here/:_auth': 'c0ffee',
        }
        assert.deepEqual(getAuth(`${config.registry}/asdf/foo/bar/baz`, config), {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: false,
            auth: 'c0ffee',
        }, 'correct _auth picked out')

        const opts = Object.assign({}, OPTS, config)
        const ms = nock(opts.registry)
            .matchHeader('authorization', 'Basic c0ffee')
            .get('/hello')
            .reply(200, '"success"')

        const res = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(res, 'success')
    })

    it('_auth username:pass auth', () => {
        const username = 'foo'
        const password = 'bar'
        const auth = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
        const config = {
            registry: 'https://my.custom.registry/here/',
            _auth: 'foobarbaz',
            '//my.custom.registry/here/:_auth': auth,
        }
        assert.deepEqual(getAuth(config.registry, config), {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: false,
            auth: auth,
        }, 'correct _auth picked out')

        const opts = Object.assign({}, OPTS, config)
        const ms = nock(opts.registry)
            .matchHeader('authorization', `Basic ${auth}`)
            .get('/hello')
            .reply(200, '"success"')

        const res = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(res, 'success')
    })

    it('ignore user/pass when _auth is set', () => {
        const username = 'foo'
        const password = Buffer.from('bar', 'utf8').toString('base64')
        const auth = Buffer.from('not:foobar', 'utf8').toString('base64')
        const config = {
            '//registry/:_auth': auth,
            '//registry/:username': username,
            '//registry/:password': password,
            'always-auth': 'false',
        }

        const expect = {
            scopeAuthKey: null,
            auth,
            isBasicAuth: false,
            token: null,
        }

        assert.deepEqual(getAuth('http://registry/pkg/-/pkg-1.2.3.tgz', config), expect)
    })

    it('globally-configured auth', () => {
        const basicConfig = {
            registry: 'https://different.registry/',
            '//different.registry/:username': 'globaluser',
            '//different.registry/:_password': Buffer.from('globalpass', 'utf8').toString('base64'),
            '//different.registry/:email': 'global@ma.il',
            '//my.custom.registry/here/:username': 'user',
            '//my.custom.registry/here/:_password': Buffer.from('pass', 'utf8').toString('base64'),
            '//my.custom.registry/here/:email': 'e@ma.il',
        }
        assert.deepEqual(getAuth(basicConfig.registry, basicConfig), {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: true,
            auth: Buffer.from('globaluser:globalpass').toString('base64'),
        }, 'basic auth details generated from global settings')

        const tokenConfig = {
            registry: 'https://different.registry/',
            '//different.registry/:_authToken': 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }
        assert.deepEqual(getAuth(tokenConfig.registry, tokenConfig), {
            scopeAuthKey: null,
            token: 'deadbeef',
            isBasicAuth: false,
            auth: null,
        })

        const _authConfig = {
            registry: 'https://different.registry/',
            '//different.registry:_auth': 'deadbeef',
            '//different.registry/bar:_auth': 'incorrect',
            '//my.custom.registry/here/:_auth': 'c0ffee',
        }
        assert.deepEqual(getAuth(`${_authConfig.registry}/foo`, _authConfig), {
            scopeAuthKey: null,
            token: null,
            isBasicAuth: false,
            auth: 'deadbeef',
        }, 'correct _auth picked out')
    })

    it('otp token passed through', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            token: 'deadbeef',
            otp: '694201',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }
        assert.deepEqual(getAuth(config.registry, config), {
            scopeAuthKey: null,
            token: 'c0ffee',
            isBasicAuth: false,
            auth: null,
        }, 'correct auth token picked out')

        const opts = Object.assign({}, OPTS, config)
        const ms =nock(opts.registry)
            .matchHeader('authorization', 'Bearer c0ffee')
            .matchHeader('npm-otp', otp => {
                assert.equal(otp[0], config.otp, 'got the right otp token')
                return otp[0] === config.otp
            })
            .get('/hello')
            .reply(200, '"success"')

        const res = fetch.jsonMock('/hello', opts, req => ms.receive(req));
        assert.equal(res, 'success')
    })

    it('different hosts for uri vs registry', () => {
        const config = {
            'always-auth': false,
            registry: 'https://my.custom.registry/here/',
            token: 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }

        const opts = Object.assign({}, OPTS, config)
        const ms = nock('https://some.other.host/')
            .matchHeader('authorization', auth => {
                assert.notOk(auth, 'no authorization header was sent')
                return !auth
            })
            .get('/hello')
            .reply(200, '"success"')
        const res = fetch.jsonMock('https://some.other.host/hello', opts, req => ms.receive(req))
        assert.equal(res, 'success', 'token auth succeeded')
    })

    it('http vs https auth sending', () => {
        const config = {
            'always-auth': false,
            registry: 'https://my.custom.registry/here/',
            token: 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }

        const opts = Object.assign({}, OPTS, config)
        const ms = nock('http://my.custom.registry/here/')
            .matchHeader('authorization', 'Bearer c0ffee')
            .get('/hello')
            .reply(200, '"success"')
        const res = fetch.jsonMock('http://my.custom.registry/here/hello', opts, req => ms.receive(req))
        assert.equal(res, 'success', 'token auth succeeded')
    })

    it('always-auth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            'always-auth': 'true',
            '//some.other.host/:_authToken': 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }
        assert.deepEqual(getAuth(config.registry, config), {
            scopeAuthKey: null,
            token: 'c0ffee',
            isBasicAuth: false,
            auth: null,
        }, 'correct auth token picked out')

        const opts = Object.assign({}, OPTS, config)
        const ms = nock('https://some.other.host/')
            .matchHeader('authorization', 'Bearer deadbeef')
            .get('/hello')
            .reply(200, '"success"')

        const res = fetch.jsonMock('https://some.other.host/hello', opts, req => ms.receive(req))
        assert.equal(res, 'success', 'token auth succeeded')
    })

    it('scope-based auth', () => {
        const config = {
            registry: 'https://my.custom.registry/here/',
            scope: '@myscope',
            '@myscope:registry': 'https://my.custom.registry/here/',
            token: 'deadbeef',
            '//my.custom.registry/here/:_authToken': 'c0ffee',
            '//my.custom.registry/here/:token': 'nope',
        }
        assert.deepEqual(getAuth(config['@myscope:registry'], config), {
            scopeAuthKey: null,
            auth: null,
            isBasicAuth: false,
            token: 'c0ffee',
        }, 'correct auth token picked out')
        assert.deepEqual(getAuth(config['@myscope:registry'], config), {
            scopeAuthKey: null,
            auth: null,
            isBasicAuth: false,
            token: 'c0ffee',
        }, 'correct auth token picked out without scope config having an @')

        const opts = Object.assign({}, OPTS, config)

        const ms = nock(opts['@myscope:registry'])
            .matchHeader('authorization', auth => {
                assert.equal(auth[0], 'Bearer c0ffee', 'got correct bearer token for scope')
                return auth[0] === 'Bearer c0ffee'
            })
            .get('/hello')
            // .times(2)
            .reply(200, '"success"')

        var res = fetch.jsonMock('/hello', opts, req => ms.receive(req))
        assert.equal(res, 'success', 'token auth succeeded')
        
        var res = fetch.jsonMock('/hello', Object.assign({}, opts, {
            scope: 'myscope',
        }), req => ms.receive(req))
        assert.equal(res, 'success', 'token auth succeeded without @ in scope')
    })

    it('auth needs a uri', () => {
        try {
            getAuth(null)
        } catch (error) {
            assert.equal(error.message, 'URI is required');
        }
    })

    it('do not be thrown by other weird configs', () => {
        const opts = {
            scope: '@asdf',
            '@asdf:_authToken': 'does this work?',
            '//registry.npmjs.org:_authToken': 'do not share this',
            _authToken: 'definitely do not share this, either',
            '//localhost:15443:_authToken': 'wrong',
            '//localhost:15443/foo:_authToken': 'correct bearer token',
            '//localhost:_authToken': 'not this one',
            '//other-registry:_authToken': 'this should not be used',
            '@asdf:registry': 'https://other-registry/',
            spec: '@asdf/foo',
        }
        const uri = 'http://localhost:15443/foo/@asdf/bar/-/bar-1.2.3.tgz'
        const auth = getAuth(uri, opts)
        assert.deepEqual(auth, {
            scopeAuthKey: null,
            token: 'correct bearer token',
            isBasicAuth: false,
            auth: null,
        })
    })

    it('scopeAuthKey tests', () => {
        const opts = {
            '@other-scope:registry': 'https://other-scope-registry.com/',
            '//other-scope-registry.com/:_authToken': 'cafebad',
            '@scope:registry': 'https://scope-host.com/',
            '//scope-host.com/:_authToken': 'c0ffee',
        }
        const uri = 'https://tarball-host.com/foo/foo.tgz'

        assert.deepEqual(getAuth(uri, { ...opts, spec: '@scope/foo@latest' }), {
            scopeAuthKey: '//scope-host.com/',
            auth: null,
            isBasicAuth: false,
            token: null,
        }, 'regular scoped spec')

        assert.deepEqual(getAuth(uri, { ...opts, spec: 'foo@npm:@scope/foo@latest' }), {
            scopeAuthKey: '//scope-host.com/',
            auth: null,
            isBasicAuth: false,
            token: null,
        }, 'scoped pkg aliased to unscoped name')

        assert.deepEqual(getAuth(uri, { ...opts, spec: '@other-scope/foo@npm:@scope/foo@latest' }), {
            scopeAuthKey: '//scope-host.com/',
            auth: null,
            isBasicAuth: false,
            token: null,
        }, 'scoped name aliased to other scope with auth')

        assert.deepEqual(getAuth(uri, { ...opts, spec: '@scope/foo@npm:foo@latest' }), {
            scopeAuthKey: null,
            auth: null,
            isBasicAuth: false,
            token: null,
        }, 'unscoped aliased to scoped name')
    })

    it('registry host matches, path does not, send auth', () => {
        const opts = {
            '@other-scope:registry': 'https://other-scope-registry.com/other/scope/',
            '//other-scope-registry.com/other/scope/:_authToken': 'cafebad',
            '@scope:registry': 'https://scope-host.com/scope/host/',
            '//scope-host.com/scope/host/:_authToken': 'c0ffee',
            registry: 'https://registry.example.com/some/path/',
        }
        const uri = 'https://scope-host.com/blahblah/bloobloo/foo.tgz'
        assert.deepEqual(getAuth(uri, { ...opts, spec: '@scope/foo' }), {
            scopeAuthKey: null,
            token: 'c0ffee',
            auth: null,
            isBasicAuth: false,
        })
        assert.deepEqual(getAuth(uri, { ...opts, spec: '@other-scope/foo' }), {
            scopeAuthKey: '//other-scope-registry.com/other/scope/',
            token: null,
            auth: null,
            isBasicAuth: false,
        })
        assert.deepEqual(getAuth(uri, { ...opts, registry: 'https://scope-host.com/scope/host/' }), {
            scopeAuthKey: null,
            token: 'c0ffee',
            auth: null,
            isBasicAuth: false,
        })
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
}