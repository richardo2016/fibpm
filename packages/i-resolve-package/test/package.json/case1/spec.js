const { resolvePackageDotJson } = require('../../../')

describe("case1", () => {
    it("resolve it", () => {
        const pkgjson = resolvePackageDotJson(require('./package.json'))

        assert.equal(pkgjson.name, "case1")
        assert.equal(pkgjson.version, "1.0.0")
    })
});