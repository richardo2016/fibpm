/// <reference types="@fibjs/types" />

declare namespace ColiIResolveInstallTarget {
    type Undefinedable<T> = undefined | T
    interface ParsedResult {
        // 0 means resolving ok, positive number means other error
        code: number,
        data: {
            type: 'npm' | 'git' | 'file' | 'tgz'
            pkgname: string,
            scope: Undefinedable<string>,
            npm_semver: Undefinedable<string>,
            npm_semver_range: Undefinedable<string>,
            git_user: Undefinedable<string>,
            git_host: Undefinedable<string>,
            git_path: Undefinedable<string>,
            git_commitsh: Undefinedable<string>,
        }
    }
}

declare module "@coli/i-resolve-install-target" {
    var mod: any
    export = mod
}