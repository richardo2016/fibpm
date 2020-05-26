const semver = require('semver')
const semverValidRange = require('semver/ranges/valid')

const NPM_REGEXP = new RegExp(
    [
        `(@[_a-zA-Z][_a-zA-Z\-0-9]*\/)?([_a-zA-Z]?[_a-zA-Z\-0-9]*)`,
        `(@.*)?`
    ].join('')
)

type Undefinedable<T> = undefined | T

export function parseInstallTarget(target: string): {
    type: 'npm' | 'git'
    pkgname: Undefinedable<string>
    scope: Undefinedable<string>
    npm_semver: Undefinedable<string>
    npm_semver_range: Undefinedable<string>
    git_user: Undefinedable<string>
    git_host: Undefinedable<string>
    git_path: Undefinedable<string>
    git_commitsh: Undefinedable<string>
} {
    const result = <ReturnType<typeof parseInstallTarget>>{
        // support it's npm but maybe set as other type later.
        type: 'npm',
        pkgname: undefined,
        scope: undefined,
        npm_semver: undefined,
        npm_semver_range: undefined,
        git_user: undefined,
        git_host: undefined,
        git_path: undefined,
        git_commitsh: undefined,
    }

    if (
        !NPM_REGEXP.test(target)
        // && !GIT_REGEXP.test(target)
    )
        throw new Error(`[@coli/i-resolve-package] invalid target ${target}`)
    
    switch (result.type) {
        case 'npm': {
            let [
                // full match
                ,
                scope,
                basename,
                npm_semver
            ] = target.match(NPM_REGEXP)
        
            let npm_semver_range
        
            if (npm_semver) {
                npm_semver = npm_semver.slice(1)
        
                if (semver.valid(npm_semver)) {
                    npm_semver_range = undefined
                } else if (semverValidRange(npm_semver)) {
                    npm_semver_range = npm_semver
                    npm_semver = undefined
                } else {
                    throw new Error(`[@coli/i-resolve-package] invalid semver in target @${npm_semver}`)
                }
            }
        
            // remove trail slash 
            if (scope) scope = scope.slice(0, -1)
        
            result.scope = scope
            result.pkgname = `${scope ? `${scope}/` : ''}${basename}`
            result.npm_semver = npm_semver
            result.npm_semver_range = npm_semver_range
        }
        break;
    }

    return result
};