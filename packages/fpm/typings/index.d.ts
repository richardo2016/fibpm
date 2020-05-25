import { getRegistryConfig } from '@coli/i-resolve-registry';
import { parseNpmrc } from '@coli/i-resolve-npmrc';
declare type ErrableResponse<T> = Error | T;
declare type CommandOptions<T = {}> = {
    /**
     * @description auth token
     */
    authToken?: string;
    /**
     * @description prefer action name
     */
    referer?: string;
    /**
     * @description npm scope
     */
    npmScope?: string;
    /**
     * @description whether always auth
     */
    alwaysAuth?: boolean;
    /**
     * @description one time password
     */
    otp?: string;
    registryType?: ReturnType<typeof getRegistryConfig>['type'];
    registry?: string;
} & T;
export declare function findAndParseNpmrc(): ReturnType<typeof parseNpmrc>;
export declare function generateAuthToken(uuid_version?: 'v1' | 'v4'): string;
export declare function getUserAgent(): string;
/**
 * @description tell registry you wanna login, fetch authToken from response header
 *
 * @alias adduser
 */
export declare function loginAsAnoymous({ registryType, registry, authToken, hostname, ...args }: CommandOptions<{
    authToken?: string;
    hostname?: string;
}>): ErrableResponse<{
    authToken: string;
}>;
export declare const login: typeof loginAsAnoymous;
export declare const adduser: typeof loginAsAnoymous;
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
export declare function getActiveAuthToken({ registryType, registry, authToken, username, email, password, otp, ...args }: CommandOptions<{
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
export declare function twoFactoryAuth({}: CommandOptions): ErrableResponse<{}>;
export declare const whoami: ({ registryType, registry, authToken, }: CommandOptions<{
    authToken?: string;
}>) => ErrableResponse<{
    username: string;
}>;
export {};
