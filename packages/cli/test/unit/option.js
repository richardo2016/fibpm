const test = require('test')
test.setup()

const FCliOption = require('../../lib/Option')

describe('FCliOption', () => {
    let option = null

    it('simple', () => {
        option = new FCliOption('--foo', 'Foo options')

        assert.deepEqual(option, {
            name: 'foo',
            names: [ 'foo' ],
            raw: '--foo',
            description: 'Foo options',

            negative: false,
            isBoolean: true,
            config: {}
        })
    })

    it('not required', () => {
        option = new FCliOption('--scale [level]', 'Scaling level')

        assert.deepEqual(option, {
            name: 'scale',
            names: [ 'scale' ],
            raw: '--scale [level]',
            description: 'Scaling level',

            negative: false,
            required: false,
            config: {}
        })
    })

    it('required', () => {
        option = new FCliOption('--out <dir>', 'Output directory')

        assert.deepEqual(option, {
            name: 'out',
            names: [ 'out' ],
            raw: '--out <dir>',
            description: 'Output directory',

            negative: false,
            required: true,
            config: {}
        })
    })

    it('negative', () => {
        option = new FCliOption('--no-config', 'Disable config file')

        assert.deepEqual(option, {
            name: 'config',
            names: [ 'config' ],
            raw: '--no-config',
            description: 'Disable config file',

            negative: true,
            isBoolean: true,
            // required: false,
            config: { default: true }
        })
    })
})

if (require.main === module)
    test.run(console.DEBUG)
