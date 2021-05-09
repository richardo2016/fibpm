const util = require('util')
const profile = require('../lib')

const { nock } = require('@fibpm/idev-mock-server');
const { Helpers } = require('@fibpm/idev-tsuites')

// function tnock(host) {
//     const server = nock(host)
//     t.tearDown(function () {
//         // server.done()
//     })
//     return server
// }

const registry = 'https://registry.npmjs.org/'

describe('mock', () => {
    it('get', () => {
        var srv = nock(registry)
        const getUrl = '/-/npm/v1/user'
        srv.get(getUrl).reply(function () {
            const auth = this.req.headers.authorization
            assert.notOk(auth)
            return [auth ? 200 : 401, '', {}]
        })

        Helpers.shouldFail(() => {
            profile.get({ __mockResponse__: srv });
        })(err => {
            assert.equal(err.code, 'E401')
        });

        var srv = nock(registry)
        srv.get(getUrl).reply(function () {
            const auth = this.req.headers.all('authorization')
            assert.deepEqual(auth, ['Bearer deadbeef'])
            return [auth ? 200 : 401, { auth: 'bearer' }, {}]
        })

        var result = profile.get({ '//registry.npmjs.org/:_authToken': 'deadbeef', __mockResponse__: srv });

        Helpers.assertLike(result, { auth: 'bearer' });

        var srv = nock(registry)
        srv.get(getUrl).reply(function () {
            const auth = this.req.headers.all('authorization')
            Helpers.assertMatch(auth[0], /^Basic /, 'got basic auth')
            const [username, password] = Buffer.from(
                auth[0].match(/^Basic (.*)$/)[1], 'base64'
            ).toString('utf8').split(':')
            assert.equal(username, 'abc', 'got username')
            assert.equal(password, '123', 'got password')
            return [auth ? 200 : 401, { auth: 'basic' }, {}]
        })

        var result = profile.get({
            '//registry.npmjs.org/:username': 'abc',
            // Passwords are stored in base64 form and npm-related consumers expect
            // them in this format. Changing this for npm would be a bigger change.
            '//registry.npmjs.org/:_password': Buffer.from('123', 'utf8').toString('base64'),
            __mockResponse__: srv
        })

        Helpers.assertLike(result, { auth: 'basic' });

        var srv = nock(registry)
        srv.get(getUrl).reply(function () {
            const auth = this.req.headers.all('authorization')
            const otp = this.req.headers.all('npm-otp')
            assert.deepEqual(auth, ['Bearer deadbeef'])
            assert.deepEqual(otp, ['1234'])
            return [auth ? 200 : 401, { auth: 'bearer', otp: !!otp }, {}]
        });

        var result = profile.get({
            otp: '1234',
            '//registry.npmjs.org/:_authToken': 'deadbeef',
            __mockResponse__: srv
        })

        Helpers.assertLike(result, { auth: 'bearer', otp: true })
        // with otp, with token, with basic
        // prob should make w/o token 401
    })

    it('set', () => {
        const prof = { user: 'zkat', github: 'zkat' }

        var srv = nock(registry).post('/-/npm/v1/user', {
            github: 'zkat',
            email: null
        }).reply(200, prof)

        var json = profile.set({
            github: 'zkat',
            email: ''
        }, {
            __mockResponse__: srv
        });

        assert.deepEqual(json, prof)
    })

    it('listTokens', () => {
        const tokens = [
            { key: 'sha512-hahaha', token: 'blah' },
            { key: 'sha512-meh', token: 'bleh' }
        ]
        const srv = nock(registry).get('/-/npm/v1/tokens').reply(200, {
            objects: tokens,
            total: 2,
            urls: {}
        })

        const tok = profile.listTokens({
            __mockResponse__: srv
        });

        assert.deepEqual(tok, tokens)
    })

    it('loginCouch happy path', () => {
        const srv = nock(registry)
            .put('/-/user/org.couchdb.user:blerp')
            .reply(201, {
                ok: true
            })

        const result = profile.loginCouch('blerp', 'password', {
            __mockResponse__: srv
        });

        assert.deepEqual(result, {
            ok: true,
            username: 'blerp'
        });
    })

    it('login fallback to couch', () => {
        const srv = nock(registry)
            .put('/-/user/org.couchdb.user:blerp')
            .reply(201, {
                ok: true
            })
            .post('/-/v1/login')
            .reply(404, { error: 'not found' })

        const opener = url => {
            // console.log('[opener] here url is', url);
            return t.fail('called opener', { url })
        }
        const prompter = creds => {
            return {
                username: 'blerp',
                password: 'prelb',
                email: 'blerp@blerp.blerp',
            }
        }

        assert.deepEqual(
            profile.login(opener, prompter, { __mockResponse__: srv }),
            {
                ok: true,
                username: 'blerp'
            }
        )
    })

    it('adduserCouch happy path', () => {
        const srv = nock(registry)
            .put('/-/user/org.couchdb.user:blerp')
            .reply(201, {
                ok: true
            })

        assert.deepEqual(
            profile.adduserCouch('blerp', '', 'password', { __mockResponse__: srv }), {
            ok: true,
            username: 'blerp'
        }
        )
    })

    it('adduser fallback to couch', () => {
        const srv = nock(registry)
            .put('/-/user/org.couchdb.user:blerp')
            .reply(201, {
                ok: true
            })
            .post('/-/v1/login')
            .reply(404, { error: 'not found' })

        const opener = url => t.fail('called opener', { url })
        const prompter = creds => {
            return {
                username: 'blerp',
                password: 'prelb',
                email: 'blerp@blerp.blerp',
            }
        }

        assert.deepEqual(
            profile.adduser(opener, prompter, { __mockResponse__: srv }),
            {
                ok: true,
                username: 'blerp'
            }
        )
    })

    it('adduserCouch happy path', () => {
        const srv = nock(registry)
            .put('/-/user/org.couchdb.user:blerp')
            .reply(201, {
                ok: true
            })

        assert.deepEqual(
            profile.adduserCouch('blerp', '', 'password', { __mockResponse__: srv }),
            {
                ok: true,
                username: 'blerp'
            }
        )
    })

    it('adduserWeb fail, just testing default opts setting', () => {
        const srv = nock(registry)
            .post('/-/v1/login')
            .reply(404, { error: 'not found' })

        const opener = url => {
            t.fail('called opener', { url })
        };

        Helpers.shouldFail(() => {
            profile.adduserWeb(opener, { __mockResponse__: srv })
        })((err) => {
            assert.equal(err.message, 'Web login not supported')
        })
    })

    it('loginWeb fail, just testing default opts setting', () => {
        const srv = nock(registry)
            .post('/-/v1/login')
            .reply(404, { error: 'not found' })
            
        const opener = url => {
            t.fail('called opener', { url })
        }

        Helpers.shouldFail(() => {
            profile.loginWeb(opener, { __mockResponse__: srv })
        })(err => {
            assert.equal(err.message, 'Web login not supported')
        });
    })


    it('listTokens multipage', () => {
        const tokens1 = [
            { key: 'sha512-hahaha', token: 'blah' },
            { key: 'sha512-meh', token: 'bleh' }
        ]
        const tokens2 = [
            { key: 'sha512-ugh', token: 'blih' },
            { key: 'sha512-ohno', token: 'bloh' }
        ]
        const tokens3 = [
            { key: 'sha512-stahp', token: 'bluh' }
        ]
        const srv = nock(registry)
        srv.get('/-/npm/v1/tokens').reply(200, {
            objects: tokens1,
            total: 2,
            urls: {
                next: '/idk/some/other/one'
            }
        })
        srv.get('/idk/some/other/one').reply(200, {
            objects: tokens2,
            total: 2,
            urls: {
                next: '/-/npm/last/one-i-swear'
            }
        })
        srv.get('/-/npm/last/one-i-swear').reply(200, {
            objects: tokens3,
            total: 1,
            urls: {}
        })
        
        const tok =  profile.listTokens({ __mockResponse__: srv });

        // supports multi-URL token requests and concats them
        assert.deepEqual(
            tok,
            tokens1.concat(tokens2).concat(tokens3),
        )
    })

    it('removeToken', () => {
        const srv = nock(registry).delete('/-/npm/v1/tokens/token/deadbeef').reply(200)

        const ret = profile.removeToken('deadbeef', { __mockResponse__: srv });

        // 'null return value on success'
        assert.equal(ret, null)
    })

    it('createToken', () => {
        const base = {
            password: 'secretPassw0rd!',
            readonly: true,
            cidr_whitelist: ['8.8.8.8/32', '127.0.0.1', '192.168.1.1']
        }
        const obj = Object.assign({
            token: 'deadbeef',
            key: 'sha512-badc0ffee',
            created: (new Date()).toString()
        })
        delete obj.password
        const srv = nock(registry).post('/-/npm/v1/tokens', base).reply(200, obj)

        const ret = profile.createToken(
            base.password,
            base.readonly,
            base.cidr_whitelist,
            { __mockResponse__: srv }
        )

        // 'got the right return value'
        assert.deepEqual(ret, obj)
    })
});