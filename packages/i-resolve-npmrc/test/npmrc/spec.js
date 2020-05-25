const path = require('path')

const { findConfigFile, parseNpmrc } = require('../../')

const getUnitTestRelpath = (relp) => {
    return path.resolve(__dirname, relp)
}

describe("findConfigFile", () => {
    it("return false is not existed", () => {
        assert.isFalse(findConfigFile(getUnitTestRelpath('./sample-non-existed')))
    })

    it("return real path if existed", () => {
        assert.isString(findConfigFile(getUnitTestRelpath('./sample1')))

        assert.equal(
            findConfigFile(getUnitTestRelpath('./sample1')),
            getUnitTestRelpath('./sample1/.npmrc')
        )

        assert.equal(
            findConfigFile(getUnitTestRelpath('./sample2')),
            getUnitTestRelpath('./sample2/.npmrc')
        )
    })
})

describe("parseNpmrc", () => {
    it("sample1", () => {
        assert.deepEqual(
            parseNpmrc(getUnitTestRelpath('./sample1/.npmrc')),
            {
                auths: [{
                    "protocol": "",
                    "hostname": "registry.npmjs.org",
                    "type": "authToken",
                    "authToken": "f23f4580-9ec3-11ea-bb37-0242ac130002"
                }],
                "npm_configs": {
                    "strict-ssl": "true"
                }
            }
        )
    })

    it("sample2", () => {
        assert.deepEqual(
            parseNpmrc(getUnitTestRelpath('./sample2/.npmrc')),
            {
                auths: [{
                    "protocol": "",
                    "hostname": "registry.npm.taobao.org",
                    "type": "authToken",
                    "authToken": "50b48678-9ec6-11ea-bb37-0242ac130002"
                }],
                "npm_configs": {
                    "strict-ssl": "false",
                    "registry": "registry.npmjs.com"
                }
            }
        )
    })

    it("sample3", () => {
        assert.deepEqual(
            parseNpmrc(getUnitTestRelpath('./sample3/.npmrc')),
            {
                auths: [{
                    "protocol": "",
                    "hostname": "registry.yarnpkg.com",
                    "type": "authToken",
                    "authToken": "094a9524-9ec7-11ea-bb37-0242ac130002"
                }],
                "npm_configs": {
                    "registry": "registry.npmjs.org"
                }
            }
        )
    })
});