const test = require('test');
test.setup();

const Mod = require('../')

describe("Mod", () => {
    it("basic", () => {
        assert.isFunction(Mod.getRegistryConfig)
    });
});

test.run(console.DEBUG);