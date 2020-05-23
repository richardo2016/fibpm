const test = require('test');
test.setup();

const Mod = require('../')

describe("I:UserProfile", () => {
    it("urls", () => {
        assert.ok(Mod.default === null)
    });
});

test.run(console.DEBUG);