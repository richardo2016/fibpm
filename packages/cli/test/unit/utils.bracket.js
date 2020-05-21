const test = require('test')
test.setup()

const utils = require('../../lib/utils')

describe('utils: bracket', () => {
  it('removeBrackets', () => {
    assert.equal(
      utils.removeBrackets('<abc>'),
      ''
    )

    assert.equal(
      utils.removeBrackets('[abc]'),
      ''
    )

    assert.equal(
      utils.removeBrackets('<[abc]>'),
      ''
    )
  })

  describe('parseBracketedArgs', () => {
	it('basic', () => {
		assert.deepEqual(
			utils.parseBracketedArgs('deploy <folder>')[0],
			{
				required: true,
				name: 'folder',
				rest: false,
			}
		)

		assert.deepEqual(
			utils.parseBracketedArgs('rm [folder]')[0],
			{
				required: false,
				name: 'folder',
				rest: false,
			}
		)

		// fixture, restrain argname as VALID VAR
		assert.deepEqual(
			utils.parseBracketedArgs('rm <[folder]>')[0],
			{
				required: false,
				name: 'folder',
				rest: false,
			}
		)
	});

	it('non-alphabet starting', () => {
		assert.deepEqual(
			utils.parseBracketedArgs('rm <$$folder>')[0],
			{
				required: true,
				name: '$$folder',
				rest: false,
			}
		)
		assert.deepEqual(
			utils.parseBracketedArgs('rm <_folder>')[0],
			{
				required: true,
				name: '_folder',
				rest: false,
			}
		)
	})

	it('rest', () => {
		assert.deepEqual(
			utils.parseBracketedArgs('rm <...otherDirs>')[0],
			{
				// rest arg is always NOT required
				required: false,
				name: 'otherDirs',
				rest: true,
			}
		)

		assert.deepEqual(
			utils.parseBracketedArgs('rm [...otherDirs]')[0],
			{
				required: false,
				name: 'otherDirs',
				rest: true,
			}
		)
	});

	it('order of results', () => {
		assert.deepEqual(
			utils.parseBracketedArgs('command <foo2> [foo1]'),
			[
				{
					required: true,
					name: 'foo2',
					rest: false,
				},
				{
					required: false,
					name: 'foo1',
					rest: false,
				}
			]
		)

		assert.deepEqual(
			utils.parseBracketedArgs('command [foo1] <foo2>'),
			[
				{
					required: true,
					name: 'foo2',
					rest: false,
				},
				{
					required: false,
					name: 'foo1',
					rest: false,
				}
			]
		)
	})
  })
})

if (require.main === module)
    test.run(console.DEBUG)
