const test = require('test');
test.setup();

const { default: fpm, Commander, findAndParseNpmrc } = require('../');

const npmrcInfo = findAndParseNpmrc()

process.env.FPM_IN_CI = true

// console.log('filename', filename);
// console.log('npmrcInfo.npm_configs', npmrcInfo.npm_configs);
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

describe("fibpm", () => {
    it("basic", () => {
        // assert.ok(FPM.default === null)
    });

    const currentAuthToken = Commander.generateAuthToken()
    let validAuthToken = FALLBACK_RO_TOKEN

    describe("helper: generateAuthToken", () => {
        it("generateAuthToken() return uuid v1", () => {
            let token = Commander.generateAuthToken()
            assert.isString(token)

            // console.info(`generate one random authToken ${token}`)
        })
    })

    describe("command: loginAsAnoymous", () => {
        it("generate authToken locally, try to login and get error from registry", () => {
            assert.deepEqual(
                fpm.loginAsAnoymous({ authToken: currentAuthToken }),
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
                fpm.getActiveAuthToken({ ...user, username: undefined, authToken: currentAuthToken }),
                'ok',
                false
            )

            assert.propertyVal(
                fpm.getActiveAuthToken({ ...user, password: undefined, authToken: currentAuthToken }),
                'ok',
                false
            )
        })

        it("try fetch authToken, email is not required", () => {
            assert.propertyVal(
                fpm.getActiveAuthToken({ ...user, email: undefined, authToken: currentAuthToken }),
                'ok',
                true
            )
        })

        // TEST IT if you know what you're testing
        it.skip("try fetch authToken, but otp required", () => {
            assert.propertyVal(
                fpm.getActiveAuthToken({ ...user, authToken: currentAuthToken }),
                'ok',
                false
            )
        })

        it("fetch authToken success", () => {
            const token = Commander.generateAuthToken()
            assert.deepEqual(
                fpm.loginAsAnoymous({ authToken: token }),
                {
                    authToken: token
                }
            )
            
            const info = fpm.getActiveAuthToken({ ...user, authToken: token })
            assert.propertyVal(info, 'ok', true)
            assert.property(info, 'id')
            assert.property(info, 'token')

            validAuthToken = info.token
        })
    })

    describe("command: whoami", () => {
        it("return empty object when auth failed", () => {
            assert.deepEqual(
                fpm.whoami({ authToken: undefined }),
                {}
            )

            assert.deepEqual(
                fpm.whoami({ authToken: Commander.generateAuthToken() }),
                {}
            )
        })

        // make sure your FPM_TEST_AUTH_TOKEN is valid
        it("auth success, return profile info with `username` field", () => {
            assert.property(
                fpm.whoami({
                    authToken: FALLBACK_RO_TOKEN
                }),
                'username'
            )
        })
    })

    describe("command: search", () => {
        function assert_searched_info(searchResult, keyword) {
            assert.property(searchResult, 'objects')
            assert.isArray(searchResult.objects)
            assert.isNumber(searchResult.total)
            assert.isString(searchResult.time)

            let abiPackageWrapper
            if (
                keyword === 'abi'
                && (abiPackageWrapper = searchResult.objects.find(item => item.package === 'abi'))
            ) {
                const abiPackage = abiPackageWrapper.package
                assert.isString(abiPackage.name)
                assert.isString(abiPackage.scope)
                assert.isString(abiPackage.version)
                assert.isString(abiPackage.date)
                assert.isObject(abiPackage.links)
                assert.isObject(abiPackage.publisher)
                assert.isArray(abiPackage.maintainers)
            }
        }
        it("search as anoymous", () => {
            const temp_fpm = new Commander()
            const searchResult = temp_fpm.search({ keyword: 'abi' })

            assert_searched_info(searchResult, 'abi')
        })

        // make sure your FPM_TEST_AUTH_TOKEN is valid
        it("search when logined", () => {
            const searchResult = fpm.search({ keyword: 'abi' })

            assert_searched_info(searchResult, 'abi')
        })
    })

    describe("command: NpmPackage resolver", () => {
        it("getNpmPackageIndexedInformationForInstall as anoymous", () => {
            const temp_fpm = new Commander()
            const indexedInfo = temp_fpm.getNpmPackageIndexedInformationForInstall({ pkgname: 'abi' })

            assert.isString(indexedInfo.name)
            assert.isObject(indexedInfo.versions)
            assert.isObject(indexedInfo['dist-tags'])
            assert.isString(indexedInfo.modified)
        })

        describe("getRequestedNpmPackageVersion as anoymous", () => {
            var temp_fpm
            before(() => {
                temp_fpm = new Commander()
            })

            it('abi', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'abi' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.0') > -1)
            })

            it('fib-typify', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.1') > -1)
            })

            it('fib-typify@^0.0.x', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@^0.0.x' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.1') > -1)
            })

            it('fib-typify@^0.0.1', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@^0.0.1' })

                assert.ok(versions.length === 1)
                assert.ok(versions[0] = '0.0.1')
            })

            it('fib-typify@^0.1.x', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@^0.1.x' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.1') === -1)
                assert.ok(versions.indexOf('0.5.0') === -1)
                assert.ok(versions.indexOf('0.1.2') > -1)
            })

            it('fib-typify@0.1.2', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@0.1.2' })

                assert.ok(versions.length === 1)
                assert.ok(versions.indexOf('0.0.1') === -1)
                assert.ok(versions.indexOf('0.5.0') === -1)
                assert.ok(versions.indexOf('0.1.2') === 0)
            })

            it('fib-typify@^0.5.x', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@^0.5.x' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.1') === -1)
                assert.ok(versions.indexOf('0.5.0') > -1)
            })

            it('fib-typify@<0.5.2', () => {
                var versions = temp_fpm.getRequestedNpmPackageVersions({ target: 'fib-typify@<0.5.2' })

                assert.ok(versions.length)
                assert.ok(versions.indexOf('0.0.1') > -1)
                assert.ok(versions.indexOf('0.1.0') > -1)
                assert.ok(versions.indexOf('0.2.0') > -1)
                assert.ok(versions.indexOf('0.3.0') > -1)
                assert.ok(versions.indexOf('0.4.0') > -1)
                assert.ok(versions.indexOf('0.5.0') > -1)
                assert.ok(versions.indexOf('0.5.1') > -1)
            })
        })
    })

    describe.skip("command: downloadNpmTarball", () => {
        it("downloadNpmTarball as anoymous", () => {
            const temp_fpm = new Commander()
            const downloadFile = temp_fpm.downloadNpmTarball({ target: 'abi@latest' })
        })
    })
});

test.run(console.DEBUG);