const test = require('test');
test.setup();

const Mod = require('../')

describe("FxLib", () => {
    it("basic", () => {
        assert.isFunction(Mod.MockServer)
        assert.isFunction(Mod.nock)
    });
});

test.run(console.DEBUG);