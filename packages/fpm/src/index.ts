import os = require('os')
import http = require('http')
import uuid = require('uuid')

// TODO: enable root certificate in httpClient only
import ssl = require('ssl')
ssl.loadRootCerts()

const pkgjson = require('../package.json')

const hc = new http.Client()
hc.userAgent = getUserAgent()
// if (process.env.http_proxy)
//     (hc as any).proxyAgent = process.env.http_proxy


import { getRegistryConfig } from '@coli/i-resolve-registry'
import { findConfigFile, parseNpmrc } from '@coli/i-resolve-npmrc'

type ErrableResponse<T> = Error | T

type CommandOptions<T = {}> = {
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
    
    registryType?: ReturnType<typeof getRegistryConfig>['type']
    registry?: string
} & T

export function findAndParseNpmrc (): ReturnType<typeof parseNpmrc> {
    return parseNpmrc(findConfigFile(process.cwd()) || undefined)
}

export function generateAuthToken (uuid_version: 'v1' | 'v4' = 'v4') {
    // which is uuid v1
    // return uuid.node().hex().toString()
    let str
    switch (uuid_version) {
        case 'v1':
            str = uuid.node().hex().toString()
            break
        default:
        case 'v4':
            str = uuid.random().hex().toString()
            break
    }

    return [
        str.slice(0, 8),
        str.slice(8, 12),
        str.slice(12, 16),
        str.slice(16, 20),
        str.slice(20),
    ].join('-')
}

export function getUserAgent () {
    return `fpm/${pkgjson.version} fibjs/v${process.version} ${process.platform} ${process.arch}`
}

function isNpmCi () {
    return `${process.env.FPM_IN_CI ? true : false}`
}

function getHeaders (input: Partial<CommandOptions<any> & {
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

function getISODateString (date = new Date()) {
    return date.toISOString()
}

/**
 * @description tell registry you wanna login, fetch authToken from response header
 * 
 * @alias adduser
 */
export function loginAsAnoymous ({
    registryType,
    registry = getRegistryConfig(registryType).registry,
    authToken = generateAuthToken(),
    hostname = os.hostname(),
    ...args
}: CommandOptions<{
    authToken?: string
    hostname?: string  
}>): ErrableResponse<{
    authToken: string
}> {
    hc.post(`${registry}/-/v1/login`, {
        json: { hostname },
        headers: getHeaders({ authToken, ...args })
    })

    return { authToken }
}

export const login = loginAsAnoymous
export const adduser = loginAsAnoymous

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
export function getActiveAuthToken ({
    registryType,
    registry = getRegistryConfig(registryType).registry,
    authToken,

    username,
    email,
    password,

    otp,
    
    ...args
}: CommandOptions<{
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
    let response = hc.put(`${registry}/-/user/${userid}`, {
        json: {...putinfo, date: getISODateString()},
        headers: getHeaders({ ...args, otp, authToken })
    })

    if (response.statusCode === 401) {
        // TODO: IF VERBOSE ENABLED, log response.json() content here

        response = hc.put(`${registry}/-/user/${userid}`, {
            json: {...putinfo, date: getISODateString()},
            headers: getHeaders({ ...args, otp, authToken })
        })
    }

    return response.json() 
}

export function twoFactoryAuth ({

} : CommandOptions): ErrableResponse<{}> {
    return {}
}

interface NPMJS_COMMAND {
    name: 'whoami'
    | 'login'
    | 'search'
    | 'install'
}


export const whoami = ({
    registryType,
    registry = getRegistryConfig(registryType).registry,
    authToken,
}: CommandOptions<{
    authToken?: string
}>): ErrableResponse<{
    username: string
}> => {
    return hc.get(`${registry}/-/whoami`, {
        headers: {
            referer: 'whoami',
            authorization: `Bearer ${authToken}`
        }
    }).json()
};