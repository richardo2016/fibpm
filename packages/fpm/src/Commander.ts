import { RayTsTypeHelpers } from '@richardo2016/ts-type-helpers'

import http = require('http')
import os = require('os')

// TODO: enable root certificate in httpClient only
import ssl = require('ssl')
ssl.loadRootCerts()

import { getRegistryConfig } from '@coli/i-resolve-registry'
import { getUuid, getISODateString, isNpmCi } from './utils'

const pkgjson = require('../package.json')

type ErrableResponse<T> = Error | T

type CommandActionOptions<T = {}> = {
    /**
     * @description auth token
     */
    authToken?: string
    /**
     * @description prefer action name
     */
    referer?: string
    /**
     * @description npm scope
     */
    npmScope?: string
    /**
     * @description whether always auth
     */
    alwaysAuth?: boolean
    /**
     * @description one time password
     */
    otp?: string
    
    registry?: string
} & T

export function getUserAgent () {
    return `fpm/${pkgjson.version} fibjs/v${process.version} ${process.platform} ${process.arch}`
}

function getHeaders (input: Partial<CommandActionOptions<any> & {
    session: string
}>) {
    return {
        'user-agent': getUserAgent(),
        'npm-in-ci': isNpmCi(),
        'npm-scope': input.npmScope || '', 
        'authorization': `Bearer ${input.authToken}`,
        ...input.referer && { 'referer': input.referer },
        ...input.session && { 'npm-session': input.session },
        ...input.otp && { 'npm-otp': input.otp },
    }
}

/**
 * @description Commander represents user state(such login status) and actions
 * when interact with npm registry
 */
export default class Commander {
    private registry: string
    private authToken: string

    private httpClient: Class_HttpClient

    static generateAuthToken () {
        return getUuid('v4')
    }

    constructor (opts: {
        registry?: Commander['registry'],
        registryType?: ReturnType<typeof getRegistryConfig>['type'],
        authToken?: Commander['authToken'],
    } = {}) {
        const {
            registryType = 'npmjs',
            registry = getRegistryConfig(registryType).registry,
            authToken = Commander.generateAuthToken(),
        } = opts;
        this.registry = registry
        this.authToken = authToken

        this.httpClient = new http.Client()
        this.httpClient.userAgent = getUserAgent()
    }

    loginAsAnoymous ({
        registry = this.registry,
        authToken = Commander.generateAuthToken(),
        hostname = os.hostname(),
        ...args
    }: CommandActionOptions<{
        authToken?: string
        hostname?: string  
    }>): ErrableResponse<{
        authToken: string
    }> {
        this.httpClient.post(`${registry}/-/v1/login`, {
            json: { hostname },
            headers: getHeaders({ authToken, ...args })
        })
    
        return { authToken }
    }

    /**
     * @description tell registry you wanna login, fetch authToken from response header
     * 
     * @alias adduser
     */
    login = this.loginAsAnoymous;
    adduser = this.loginAsAnoymous;

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
    getActiveAuthToken ({
        registry = this.registry,
        authToken = this.authToken,

        username,
        email,
        password,

        otp,
        
        ...args
    }: CommandActionOptions<{
        username: string
        email: string
        password: string
    }>): ErrableResponse<{
        ok: false,
        /**
         * @description user id, like `org.couchdb.user:<username>`
         */
        id: string
    } | {
        ok: true,
        id: string
        /**
         * @description pointless, it's `we_dont_use_revs_any_more` from npmjs.com
         */
        rev: string
        /**
         * @description real auth token from server, generally it should replace local one and persist to npm config file
         */
        token: string
    }> {
        const userid = `org.couchdb.user:${username}`
        const putinfo = {
            _id: "org.couchdb.user:richardo2016",
            name: username,
            password,
            type: 'user',
            roles: <string[]>[],
        }
        let response = this.httpClient.put(`${registry}/-/user/${userid}`, {
            json: {...putinfo, date: getISODateString()},
            headers: getHeaders({ ...args, otp, authToken })
        })

        if (response.statusCode === 401) {
            // TODO: IF VERBOSE ENABLED, log response.json() content here

            response = this.httpClient.put(`${registry}/-/user/${userid}`, {
                json: {...putinfo, date: getISODateString()},
                headers: getHeaders({ ...args, otp, authToken })
            })
        }

        return response.json() 
    }

    whoami ({
        registry = this.registry,
        authToken = this.authToken,
    }: CommandActionOptions<{
        authToken?: string
    }>): ErrableResponse<{
        username: string
    }> {
        return this.httpClient.get(`${registry}/-/whoami`, {
            headers: {
                referer: 'whoami',
                authorization: `Bearer ${authToken}`
            }
        }).json()
    };
}
