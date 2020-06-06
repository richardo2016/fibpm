import fs = require('fs')
import path = require('path')
import { PackageJSON } from './PackageInfo'

const semver = require('semver')
const semverValidRange = require('semver/ranges/valid')

const NPM_REGEXP = new RegExp(
    [
        `(@[_a-zA-Z][_a-zA-Z\-0-9]*\/)?([_a-zA-Z]?[_a-zA-Z\-0-9]*)`,
        `(@.*)?`
    ].join('')
)

type Undefinedable<T> = undefined | T

type NPM_TAG = 'latest' | 'beta' | 'next' | string
// TODO: use robust validation
function isNpmTag(input: string): input is NPM_TAG {
    return (
        input === 'latest'
        || input === 'beta'
        || input === 'next'
        || (typeof input === 'string' && !!input.length)
    )
}

interface PackageTargetInfo {
    type: 'npm' | 'git' | 'file'
    pkgname: Undefinedable<string>
    scope: Undefinedable<string>
    npm_semver: Undefinedable<string>
    npm_semver_range: Undefinedable<string>
    // @see https://docs.npmjs.com/cli/dist-tag
    npm_tag: Undefinedable<NPM_TAG>,
    git_user: Undefinedable<string>
    git_host: Undefinedable<string>
    git_path: Undefinedable<string>
    git_commitsh: Undefinedable<string>
}

export function parseInstallTarget(target: string): PackageTargetInfo {
    const result = <ReturnType<typeof parseInstallTarget>>{
        // support it's npm but maybe set as other type later.
        type: 'npm',
        pkgname: undefined,
        scope: undefined,
        npm_semver: undefined,
        npm_semver_range: undefined,
        npm_tag: undefined,
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
                _npm_semver
            ] = target.match(NPM_REGEXP)

            /* scope & pkgname :start */
            // remove trail slash 
            if (scope) scope = scope.slice(0, -1)
        
            result.scope = scope
            result.pkgname = `${scope ? `${scope}/` : ''}${basename}`
            /* scope & pkgname :end */
        
            /* npm semver & npm tag :start */
            let npm_semver_range
            if (_npm_semver) {
                let npm_semver = _npm_semver.replace(/^@/, '')
        
                if (semver.valid(npm_semver)) {
                    npm_semver_range = undefined
                } else if (semverValidRange(npm_semver)) {
                    npm_semver_range = npm_semver
                    npm_semver = undefined
                } else if (isNpmTag(npm_semver) && !!result.pkgname) {
                    result.npm_tag = npm_semver as NPM_TAG
                    npm_semver = undefined
                } else {
                    throw new Error(`[@coli/i-resolve-package] invalid semver '${_npm_semver}' in target '${target}'`)
                }

                _npm_semver = npm_semver
            }
        
            result.npm_semver = _npm_semver
            result.npm_semver_range = npm_semver_range
            /* npm semver & npm tag :end */
        }
        break;
    }

    return result
};

interface InstallTree {
    root: InstallNode
}

const enum InstallDependencySource {
    dependencies = 1,
    devDependencies
}

interface InstallNode {
    target: PackageTargetInfo
    dependencies: {
        source: InstallDependencySource
    }[]
}

type InstallDependencyNode = InstallNode['dependencies'][any]

export function getInstallTree (
    rootNode: InstallNode,
    {
        onParseInstallTarget = parseInstallTarget
    }: {
        onParseInstallTarget?: (target: string) => PackageTargetInfo
        onDeduplicate?: (target: PackageTargetInfo, dependencies: InstallDependencyNode[]) => void

        getMatchedVersion?: (target: PackageTargetInfo) => PackageTargetInfo
    } = {}
): InstallTree {
    return 
}

export function resolvePackageDotJson(entry: string | any): PackageJSON {
    let pkgjson: PackageJSON

    switch (typeof entry) {
        case 'object':
            pkgjson = entry as PackageJSON
            break
        case 'string':
            entry = path.resolve(process.cwd(), entry)
            try {
                pkgjson = JSON.parse(fs.readTextFile(entry))
            } catch (error) {
                throw new Error(`[resolvePackageDotJson] error occured! ${error.message}`)
            }
            break
        default:
            throw new Error(`[resolvePackageDotJson] unsupported entry ${typeof entry}`)
    }

    return pkgjson
}