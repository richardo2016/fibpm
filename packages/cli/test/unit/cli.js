const test = require('test')
test.setup()

const fcli = require('../../lib')

describe('FCli', () => {
    it('negative option', () => {
        const cli = fcli()

        cli.option('--foo [foo]', 'Set foo').option('--no-foo', 'Disable foo')

        cli.option('--bar [bar]', 'Set bar').option('--no-bar', 'Disable bar')

        const { options } = cli.parse(['fibjs', 'bin', '--foo', 'foo', '--bar'])
        assert.deepEqual(options, {
            '--': [],
            foo: 'foo',
            bar: true
        })
    })

    it('double dashes', () => {
        const cli = fcli()

        const { args, options } = cli.parse([
            'fibjs',
            'bin',
            'foo',
            'bar',
            '--',
            'ffmpeg',
            'test'
        ])

        assert.deepEqual(args, ['foo', 'bar'])
        assert.deepEqual(options['--'], ['ffmpeg', 'test'])
    })

    it('negative optional validation', () => {
        const cli = fcli()

        cli.option('--config <config>', 'config file')
        cli.option('--no-config', 'no config file')

        const { options } = cli.parse(`fibjs bin --no-config`.split(' '))

        cli.topLevelCommand.checkOptionValue()
        assert.isFalse(options.config)
    })

    it('array types without transformFunction', () => {
		const cli = fcli()

		cli
			.option(
				'--externals <external>',
				'Add externals(can be used for multiple times',
				{
					type: []
				}
			)
			.option('--scale [level]', 'Scaling level')

		const { options: options1 } = cli.parse(
			`fibjs bin --externals.env.prod production --scale`.split(' ')
		)
		assert.deepEqual(options1.externals, [{ env: { prod: 'production' } }])
		assert.deepEqual(options1.scale, true)

		const { options: options2 } = cli.parse(
			`fibjs bin --externals foo --externals bar`.split(' ')
		)
		assert.deepEqual(options2.externals, ['foo', 'bar'])

		const { options: options3 } = cli.parse(
			`fibjs bin --externals.env foo --externals.env bar`.split(' ')
		)
		assert.deepEqual(options3.externals, [{ env: ['foo', 'bar'] }])
    })

	it('array types with transformFunction', () => {
		const cli = fcli()

		cli
			.command('build [entry]', 'Build your app')
			.option('--config <configFlie>', 'Use config file for building', {
				type: [String]
			})
			.option('--scale [level]', 'Scaling level')

		const { options } = cli.parse(
			`node bin build app.js --config config.js --scale`.split(' ')
		)
		assert.deepEqual(options.config, ['config.js'])
		assert.equal(options.scale, true)
	})
})

if (require.main === module)
    test.run(console.DEBUG)
