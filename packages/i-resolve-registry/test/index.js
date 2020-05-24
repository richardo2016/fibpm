const test = require('test');
test.setup();

const FPM = require('../')

describe("FPM", () => {
    it("basic", () => {
        assert.isFunction(FPM.getRegistryConfig)
    });
});

test.run(console.DEBUG);