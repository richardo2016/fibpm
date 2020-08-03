/// <reference types="@fibjs/types" />
import { getRegistryConfig } from '@fibpm/i-resolve-registry';
import { NpmPackageInfoAsDependency, NpmPackageIndexedCriticalInfo, NpmPackageInfoFromBrowser } from './types/NpmPackage';
import { CommandActionOptions, CmderSearchActionParams, CmderSearchActionResult, ISearchedPkgInfoWithDetail } from './types/NpmComand';
declare type ErrableResponse<T> = Error | T;
export declare function getUserAgent(): string;
/**
 * @description Commander represents user state(such login status) and actions
 * when interact with npm registry
 */
export default class Commander {
    private registry;
    private authToken;
    private httpClient;
    static generateAuthToken(): string;
    constructor(opts?: {
        registry?: Commander['registry'];
        registryType?: ReturnType<typeof getRegistryConfig>['type'];
        authToken?: Commander['authToken'];
    });
    loginAsAnoymous({ registry, authToken, hostname, ...args }: CommandActionOptions<{
        authToken?: string;
        hostname?: string;
    }>): ErrableResponse<{
        authToken: string;
    }>;
    /**
     * @description tell registry you wanna login, fetch authToken from response header
     *
     * @alias adduser
     */
    login: ({ registry, authToken, hostname, ...args }: CommandActionOptions<{
        authToken?: string;
        hostname?: string;
    }>) => ErrableResponse<{
        authToken: string;
    }>;
    adduser: ({ registry, authToken, hostname, ...args }: CommandActionOptions<{
        authToken?: string;
        hostname?: string;
    }>) => ErrableResponse<{
        authToken: string;
    }>;
    /**
     *
     * @description login to registry
     *
     * always return one authToken.
     *
     * if username/password/email match,
     * - if 2FA enabled but otp not provided, status of http response is 401
     * - if 2FA disabled or but valid otp provided, return user profile
     */
    getActiveAuthToken({ registry, authToken, username, email, password, otp, ...args }: CommandActionOptions<{
        username: string;
        email: string;
        password: string;
    }>): ErrableResponse<{
        ok: false;
        /**
         * @description user id, like `org.couchdb.user:<username>`
         */
        id: string;
    } | {
        ok: true;
        id: string;
        /**
         * @description pointless, it's `we_dont_use_revs_any_more` from npmjs.com
         */
        rev: string;
        /**
         * @description real auth token from server, generally it should replace local one and persist to npm config file
         */
        token: string;
    }>;
    /**
     * @description ask npm server who is local user with authToken
     */
    whoami({ registry, authToken, }: CommandActionOptions<{
        authToken?: string;
    }>): ErrableResponse<{
        username: string;
    }>;
    /**
     * @description search npm package on server
     */
    search({ registry, authToken, offset, size, keyword, ...args }: CmderSearchActionParams): ErrableResponse<CmderSearchActionResult>;
    searchAndGetIndexedInfo(params: CmderSearchActionParams): ErrableResponse<ISearchedPkgInfoWithDetail>;
    /**
     * @description audit installed npm packages(in node_modules directory generally)quickly
     *
     * @no_test
     */
    quickSecurityAudits({ registry, authToken, ...args }: CommandActionOptions<{
        /**
         * @description npm project's name to be audited
         */
        name: string;
        /**
         * @description packages required by npm projects
         */
        requires: NpmPackageInfoAsDependency['requires'];
        dependencies: {
            [depname: string]: NpmPackageInfoAsDependency;
        };
    }>): ErrableResponse<{
        "actions": [];
        "advisories": {};
        "muted": [];
        "metadata": {
            "vulnerabilities": {
                "info": number;
                "low": number;
                "moderate": number;
                "high": number;
                "critical": number;
            };
            "dependencies": number;
            "devDependencies": number;
            "optionalDependencies": number;
            "totalDependencies": number;
        };
    }>;
    getNpmPackageIndexedInformationForInstall({ pkgname, registry, ...args }: CommandActionOptions<{
        pkgname: string;
    }>): ErrableResponse<NpmPackageIndexedCriticalInfo>;
    getNpmPackageIndexedInformationForExplorer({ pkgname, registry, ...args }: CommandActionOptions<{
        pkgname: string;
    }>): ErrableResponse<NpmPackageInfoFromBrowser>;
    getRequestedNpmPackageVersions({ target, ...args }: CommandActionOptions<{
        target: string;
    }>): string[] | Error;
    downloadNpmTarball({ registry, target, ...args }: CommandActionOptions<{
        /**
         * @description install target
         *
         * @sample 'typescript@latest'
         * @sample 'fib-typify@latest'
         * @sample 'fib-typify@^0.8.x'
         */
        target: string;
    }>): Class_HttpResponse;
}
export {};
