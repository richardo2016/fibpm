import { getRegistryConfig } from '@coli/i-resolve-registry';
declare type ErrableResponse<T> = Error | T;
declare type CommandActionOptions<T = {}> = {
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
    registry?: string;
} & T;
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
    whoami({ registry, authToken, }: CommandActionOptions<{
        authToken?: string;
    }>): ErrableResponse<{
        username: string;
    }>;
}
export {};
