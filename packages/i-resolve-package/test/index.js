const test = require('test');
test.setup();

const IResolvePackage = require('../')

describe("i-resolve-package", () => {
    it("bad target input", () => {
        assert.throws(() => {
            IResolvePackage.parseInstallTarget(`@123/ci`)
        })
    })

    it("[<@scope>/]<pkg>", () => {
        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`lodash`),
            {
                type: 'npm',
                pkgname: 'lodash',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`@fibjs/ci`),
            {
                type: 'npm',
                pkgname: '@fibjs/ci',
                scope: '@fibjs',
                npm_semver: undefined,
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`123`),
            {
                type: 'npm',
                pkgname: '123',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )
    });
    
    it("[<@scope>/]<pkg>@<version>", () => {
        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`lodash@1.0.1`),
            {
                type: 'npm',
                pkgname: 'lodash',
                scope: undefined,
                npm_semver: '1.0.1',
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`@fibjs/ci@1.0.5`),
            {
                type: 'npm',
                pkgname: '@fibjs/ci',
                scope: '@fibjs',
                npm_semver: '1.0.5',
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`123@1.0.1`),
            {
                type: 'npm',
                pkgname: '123',
                scope: undefined,
                npm_semver: '1.0.1',
                npm_semver_range: undefined,
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )
    });

    it("[<@scope>/]<pkg>@<version range>", () => {
        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`lodash@>=1.0.1`),
            {
                type: 'npm',
                pkgname: 'lodash',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: '>=1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`lodash@^1.0.1`),
            {
                type: 'npm',
                pkgname: 'lodash',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: '^1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`@fibjs/ci@>=1.0.1`),
            {
                type: 'npm',
                pkgname: '@fibjs/ci',
                scope: '@fibjs',
                npm_semver: undefined,
                npm_semver_range: '>=1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`@fibjs/ci@^1.0.1`),
            {
                type: 'npm',
                pkgname: '@fibjs/ci',
                scope: '@fibjs',
                npm_semver: undefined,
                npm_semver_range: '^1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`123@>=1.0.1`),
            {
                type: 'npm',
                pkgname: '123',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: '>=1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )

        assert.deepEqual(
            IResolvePackage.parseInstallTarget(`123@^1.0.1`),
            {
                type: 'npm',
                pkgname: '123',
                scope: undefined,
                npm_semver: undefined,
                npm_semver_range: '^1.0.1',
                git_user: undefined,
                git_host: undefined,
                git_path: undefined,
                git_commitsh: undefined
            }
        )
    });
});

test.run(console.DEBUG);