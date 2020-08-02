const test = require('test')
test.setup()

const path = require('path')
const uuid = require('uuid')

const cmd = process.execPath
const cwd = process.cwd()
const root = path.resolve(__dirname, '../../')

function textQuote(input) {
	return process.platform === 'win32' ? JSON.stringify(input) : input
}

describe('Examples', () => {
	before(() => {
		// process.chdir(root)
	})

	after(() => {
		// process.chdir(cwd)
	})

	const md5Value = uuid.md5(uuid.URL, Date.now()).hex()

	;[
		[
			'basic-usages',
			'./examples/basic-usages.js',
			['--type', 'fibjs'],
			`{\n  \"args\": [],\n  \"options\": {\n    \"--\": [],\n    \"type\": \"fibjs\"\n  }\n}`
		],
		[
			'help',
			'./examples/help.js',
			['--help'],
			``
		],
	].filter(x => x).forEach(([desc, fpath, argvs, result, isJson]) => {
		it(desc, () => {
			const sp = process.open(
				cmd,
				[fpath].concat(argvs)
			)
			// normalize EOL of stdout
			// sp.stdout.EOL = '\n'
			sp.wait()
			const output = sp.stdout.readLines().join('\n')

			if (result)
			assert.equal(output, result)
		})
	})
})

if (require.main === module)
    test.run(console.DEBUG)
