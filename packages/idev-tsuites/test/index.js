const test = require('test');
test.setup();

const Mod = require('../')

describe("FxLib", () => {
    it("basic", () => {
        assert.isObject(Mod.Helpers)
    });
});

test.run(console.DEBUG);