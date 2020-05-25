const test = require('test');
test.setup();

describe("FxLib", () => {
    require('./npmrc/spec')
});

test.run(console.DEBUG);