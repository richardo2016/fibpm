import { parseInstallTarget } from '@fibpm/i-resolve-package'

const semver = require('semver')

export function checkoutValidNpmPackageVersions (
    target: string | Partial<Pick<
        ReturnType<typeof parseInstallTarget>,
        'npm_semver' | 'npm_tag' | 'npm_semver_range'
    >>,
    versions: string[]
) {
    const info = typeof target !== 'string' ? target : parseInstallTarget(target)
    const { npm_semver, npm_tag, npm_semver_range } = info

    const validVersions: string[] = []
    const requestedVersion = npm_semver || npm_tag || npm_semver_range
    versions.forEach(v => {
        if (!requestedVersion) {
            validVersions.push(v)
        } else if (
            semver.satisfies(v, npm_semver)
            || semver.satisfies(v, npm_tag)
            || semver.satisfies(v, npm_semver_range)
        ) {
            validVersions.push(v) 
        }
    })

    return validVersions
}