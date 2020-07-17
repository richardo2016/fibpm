import { parseInstallTarget } from '@coli/i-resolve-package';
export declare function checkoutValidNpmPackageVersions(target: string | Partial<Pick<ReturnType<typeof parseInstallTarget>, 'npm_semver' | 'npm_tag' | 'npm_semver_range'>>, versions: string[]): string[];
