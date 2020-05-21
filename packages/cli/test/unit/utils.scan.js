const test = require('test')
test.setup()

const utils = require('../../lib/utils')

xdescribe('utils', () => {
  describe('scan, with default options', () => {
    it('empty', () => {
      var parsed_info = utils.scan(process.argv.slice(2));
      assert.deepEqual(parsed_info, {
        "_": []
      })

      var parsed_info = utils.scan(['']);
      assert.deepEqual(parsed_info, {
        "_": [""]
      })
    })

    it('one hyphenated argument', () => {
      var parsed_info = utils.scan('-a');
      assert.deepEqual(parsed_info, {
        "_": [
        ],
        "a": true
      })
    })

    it('one double hyphenated argument', () => {
      var parsed_info = utils.scan('--abc');
      assert.deepEqual(parsed_info, {
        "_": [],
        "abc": true
      })
    })

    it('one valued double hyphenated argument', () => {
      var parsed_info = utils.scan('--foo bar');
      assert.deepEqual(parsed_info, {
        "_": [],
        "foo bar": true
      })

      var parsed_info = utils.scan(['--foo']);
      assert.deepEqual(parsed_info, {
        "_": [],
        "foo": true
      })

      var parsed_info = utils.scan(['--foo', 'bar']);
      assert.deepEqual(parsed_info, {
        "_": [],
        "foo": "bar"
      })
    })
  })

  it('with --', () => {
    var parsed_info = utils.scan(['-no-f', '--foo1=bar1', 'bare', '--foo2', '--', 'http', 'etc'], {
      boolean: []
    });

    assert.deepEqual(parsed_info, {
      "_": ["bare", "http", "etc"],
      "f": false,
      "foo2": true,
      "foo1": 'bar1'
    })
  })

  describe('scan, boolean', () => {
    it('without boolean set', () => {
      var parsed_info = utils.scan(['-no-f', '--foo1', '--foo2', 'bar2'], {
        boolean: []
      });

      assert.deepEqual(parsed_info, {
        "_": [],
        "f": false,
        "foo1": true,
        "foo2": 'bar2'
      })
    })

    it('with .boolean set', () => {
      var parsed_info = utils.scan(['-no-f', '--foo1', '--foo2', 'bar2', '-f', '--f4'], {
        boolean: ['foo2', 'f'],
      });

      assert.deepEqual(parsed_info, {
        "_": ["bar2"],
        "f": [
          false,
          true
        ],
        "foo1": true,
        "foo2": true,
        "f4": true
      })
    })

    it('with .boolean/.default set', () => {
      var parsed_info = utils.scan(['-no-f', '--foo1', '--foo2', 'bar2', '-f', '--f4'], {
        boolean: ['foo2', 'f'],
        default: {
          f4: false
        }
      });

      assert.deepEqual(parsed_info, {
        "_": ["bar2"],
        "f": [
          false,
          true
        ],
        "foo1": true,
        "foo2": true,
        // notice: passed value(true) overwrite the default one
        "f4": true
      })

      var parsed_info = utils.scan(['-no-f', '--foo1', '--foo2', 'bar2', '-f'], {
        boolean: ['foo2', 'f'],
        default: {
          f4: false
        }
      });

      assert.deepEqual(parsed_info, {
        "_": ["bar2"],
        "f": [
          false,
          true
        ],
        "foo1": true,
        "foo2": true,
        "f4": false
      })
    })
  })

  describe('scan number', () => {
    it('default', () => {
      var parsed_info = utils.scan(['--foo1=2']);

      assert.deepEqual(parsed_info, {
        "_": [],
        "foo1": 2,
      })
    })

    it('restrain argkey as boolean', () => {
      var parsed_info = utils.scan(['--foo1=2'], {boolean: 'foo1'});

      assert.deepEqual(parsed_info, {
        "_": [2],
        "foo1": true,
      })
    })
  })

  describe('scan string', () => {
    it('with .boolean/.string set', () => {
      var parsed_info = utils.scan(['-no-f', '--foo1', '--foo2', 'bar2', '-f', '--f4'], {
        boolean: ['foo2', 'f'],
        string: ['f4']
      });

      assert.deepEqual(parsed_info, {
        "_": ["bar2"],
        "f": [
          false,
          true
        ],
        "foo1": true,
        "foo2": true,
        "f4": ""
      })
    })
  })
})

if (require.main === module)
    test.run(console.DEBUG)
