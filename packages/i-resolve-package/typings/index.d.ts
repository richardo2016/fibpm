declare type Undefinedable<T> = undefined | T;
export declare function parseInstallTarget(target: string): {
    type: 'npm' | 'git';
    pkgname: Undefinedable<string>;
    scope: Undefinedable<string>;
    npm_semver: Undefinedable<string>;
    npm_semver_range: Undefinedable<string>;
    git_user: Undefinedable<string>;
    git_host: Undefinedable<string>;
    git_path: Undefinedable<string>;
    git_commitsh: Undefinedable<string>;
};
export {};
