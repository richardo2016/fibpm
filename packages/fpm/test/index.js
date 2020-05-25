const test = require('test');
test.setup();

const FPM = require('../')

const npmrcInfo = FPM.findAndParseNpmrc()

process.env.FPM_IN_CI = true

// console.log('filename', filename);
console.log('npmrcInfo.npm_configs', npmrcInfo.npm_configs);
// console.log('npmrcInfo.auths', npmrcInfo.auths);
const authCfg = npmrcInfo.auths.find(item => item.type === 'authToken')

// this is one read-only token for test_fpm
const FALLBACK_RO_TOKEN = `0cb1ea11-7423-456e-8051-0b467d8c583e`
const FPM_TEST_AUTH_TOKEN = process.env.FPM_TEST_AUTH_TOKEN || (authCfg ? authCfg.authToken : FALLBACK_RO_TOKEN)
const testUser = {
    username: 'test_fpm',
    password: 'test-fpm123',
    email: 'test-fpm123@gmail.com',
}

describe("FPM", () => {
    it("basic", () => {
        // assert.ok(FPM.default === null)
    });

    const currentAuthToken = FPM.generateAuthToken()
    let validAuthToken = FALLBACK_RO_TOKEN

    describe("helper: generateAuthToken", () => {
        it("generateAuthToken() return uuid v1", () => {
            let token = FPM.generateAuthToken()
            assert.isString(token)

            // console.info(`generate one random authToken ${token}`)
        })
    })

    describe("command: loginAsAnoymous", () => {
        it("generate authToken locally, try to login and get error from registry", () => {
            assert.deepEqual(
                FPM.loginAsAnoymous({ authToken: currentAuthToken }),
                {
                    authToken: currentAuthToken
                }
            )
        })
    })

    describe("command: getActiveAuthToken", () => {
        const user = { ...testUser }

        it("try fetch authToken, but username/password required", () => {
            assert.propertyVal(
                FPM.getActiveAuthToken({ ...user, username: undefined, authToken: currentAuthToken }),
                'ok',
                false
            )

            assert.propertyVal(
                FPM.getActiveAuthToken({ ...user, password: undefined, authToken: currentAuthToken }),
                'ok',
                false
            )
        })

        it("try fetch authToken, email is not required", () => {
            assert.propertyVal(
                FPM.getActiveAuthToken({ ...user, email: undefined, authToken: currentAuthToken }),
                'ok',
                true
            )
        })

        // TEST IT if you know what you're testing
        it.skip("try fetch authToken, but otp required", () => {
            assert.propertyVal(
                FPM.getActiveAuthToken({ ...user, authToken: currentAuthToken }),
                'ok',
                false
            )
        })

        it("fetch authToken success", () => {
            const token = FPM.generateAuthToken()
            assert.deepEqual(
                FPM.loginAsAnoymous({ authToken: token }),
                {
                    authToken: token
                }
            )
            
            const info = FPM.getActiveAuthToken({ ...user, authToken: token })
            assert.propertyVal(info, 'ok', true)
            assert.property(info, 'id')
            assert.property(info, 'token')

            validAuthToken = info.token
        })
    })

    describe("command: whoami", () => {
        it("return empty object when auth failed", () => {
            assert.deepEqual(
                FPM.whoami({ authToken: undefined }),
                {}
            )

            assert.deepEqual(
                FPM.whoami({ authToken: FPM.generateAuthToken() }),
                {}
            )
        })

        // make sure your FPM_TEST_AUTH_TOKEN is valid
        it("auth success, return profile info with `username` field", () => {
            assert.property(
                FPM.whoami({
                    authToken: FALLBACK_RO_TOKEN
                }),
                'username'
            )
        })
    })
});

test.run(console.DEBUG);