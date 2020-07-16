import { PackageJSON } from './PackageInfo';
export { PackageJSON };
declare type Undefinedable<T> = undefined | T;
declare type NPM_TAG = 'latest' | 'beta' | 'next' | string;
interface PackageTargetInfo {
    type: 'npm' | 'git' | 'file';
    pkgname: Undefinedable<string>;
    scope: Undefinedable<string>;
    npm_semver: Undefinedable<string>;
    npm_semver_range: Undefinedable<string>;
    npm_tag: Undefinedable<NPM_TAG>;
    git_user: Undefinedable<string>;
    git_host: Undefinedable<string>;
    git_path: Undefinedable<string>;
    git_commitsh: Undefinedable<string>;
}
export declare function parseInstallTarget(target: string): PackageTargetInfo;
interface InstallTree {
    root: InstallNode;
}
declare const enum InstallDependencySource {
    dependencies = 1,
    devDependencies = 2
}
interface InstallNode {
    target: PackageTargetInfo;
    dependencies: {
        source: InstallDependencySource;
    }[];
}
declare type InstallDependencyNode = InstallNode['dependencies'][any];
export declare function getInstallTree(rootNode: InstallNode, { onParseInstallTarget }?: {
    onParseInstallTarget?: (target: string) => PackageTargetInfo;
    onDeduplicate?: (target: PackageTargetInfo, dependencies: InstallDependencyNode[]) => void;
    getMatchedVersion?: (target: PackageTargetInfo) => PackageTargetInfo;
}): InstallTree;
export declare function resolvePackageDotJson(entry: string | any): PackageJSON;
