const test = require('test');
test.setup();

const url = require('url');

const profile = require('../')

const FALLBACK_RO_TOKEN = `0cb1ea11-7423-456e-8051-0b467d8c583e`
const FPM_TEST_AUTH_TOKEN = process.env.FPM_TEST_AUTH_TOKEN || FALLBACK_RO_TOKEN
const testUser = {
    username: 'test_fpm',
    password: 'test-fpm123',
    email: 'test-fpm123@gmail.com',
}

const OPTS = {
    timeout: 0,
    // retry: {
    //     retries: 1,
    //     factor: 1,
    //     minTimeout: 1,
    //     maxTimeout: 10,
    // },
    headers: {
        'npm-in-ci': 'true'
    },
    registry: 'https://registry.npmjs.org/',
}

const getRegKeyHost = (uri) => {
    // return url.replace(/^https?:/, '');
    return url.parse(uri).hostname;
}

describe("npm-profile", () => {
    it("basic", () => {
        assert.isFunction(profile.adduserCouch)
        assert.isFunction(profile.loginCouch)
        // assert.isFunction(Mod.login)
    });

    it('#adduserCouch', () => {
        const result = profile.adduserCouch(
            testUser.username,
            testUser.email,
            testUser.password,
            Object.assign({}, OPTS)
        );

        assert.isString(result.token);
        assert.isTrue(result.ok);
        assert.equal(result.username, testUser.username);
        assert.equal(result.id.indexOf('org.couchdb.user:'), 0);
    });

    it('#loginCouch', () => {
        const result = profile.loginCouch(
            testUser.username,
            testUser.password,
        );

        assert.isString(result.token);
        assert.isTrue(result.ok);
        assert.equal(result.username, testUser.username);
        assert.equal(result.id.indexOf('org.couchdb.user:'), 0);
    });

    describe('interaction', () => {
        let token = '';
        const regKey = getRegKeyHost(OPTS.registry);

        before(() => {
            const result = profile.adduserCouch(
                testUser.username,
                testUser.email,
                testUser.password,
                Object.assign({}, OPTS)
            );

            token = result.token;

            console.notice(`test token is ${token}`)
        });

        describe('#get', () => {
            function assertProfile (gotProfile) {
                assert.isString(gotProfile.name)
                assert.isString(gotProfile.fullname)
                assert.isString(gotProfile.email)
                // two factor authentication
                assert.isBoolean(gotProfile.tfa)
                // is email verifyed
                assert.isBoolean(gotProfile.email_verified)
                // ISO Date String
                assert.isString(gotProfile.created)
                // ISO Date String
                assert.isString(gotProfile.updated)
            }

            it('via :_authToken', () => {
                const result = profile.get({
                    [`//${regKey}/:_authToken`]: token
                });

                assertProfile(result);
            });

            it('via :username/:_password', () => {
                const result = profile.get({
                    [`//${regKey}/:username`]: testUser.username,
                    // Passwords are stored in base64 form and npm-related consumers expect
                    // them in this format. Changing this for npm would be a bigger change.
                    [`//${regKey}/:_password`]: Buffer.from(testUser.password, 'utf8').toString('base64'),
                });

                assertProfile(result);
            });
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
}