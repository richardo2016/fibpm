import { parseInstallTarget } from '@fibpm/i-resolve-package'

import http = require('http')
import os = require('os')
import util = require('util')

import coroutine = require('coroutine')

import { getRegistryConfig } from '@fibpm/i-resolve-registry'
import { getUuid, getISODateString, isNpmCi } from './utils'

// TODO: enable root certificate in httpClient only
import ssl = require('ssl')
import { NpmPackageInfoAsDependency, NpmPackageIndexedCriticalInfo, NpmPackageInfoFromBrowser } from './types/NpmPackage'
import { checkoutValidNpmPackageVersions } from './Helpers'
import { CommandActionOptions, CmderSearchActionParams, CmderSearchActionResult, ISearchPkgInfo, ISearchedPkgInfoWithDetail } from './types/NpmComand'

ssl.loadRootCerts()

const pkgjson = require('../package.json')

function tryJSONParseHttpResponse (response: Class_HttpResponse) {
    switch (response.headers.first('Content-Type')) {
        case 'application/json':
            return response.json() 
        // sometimes, response from remote could be FILTERED by local proxy server.
        default:
            return JSON.parse(response.body.readAll() + '')
    }
}

type ErrableResponse<T> = Error | T

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
        'accept': `application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*`,
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
        if (process.env.http_proxy) {
            (this.httpClient as any).proxyAgent = process.env.http_proxy
            if (isNpmCi())
                (ssl as any).verification = ssl.VERIFY_NONE
        }

        // if ((this.httpClient as any).setClientCert) {
        //     const cert = new crypto.X509Cert();
        //     var k = new crypto.PKey();
        //     cert.loadRootCerts();
            
        //     ;(this.httpClient as any).setClientCert(cert, k);
        // }
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
            _id: `org.couchdb.user:${username}`,
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

        return tryJSONParseHttpResponse(response)
    }

    /**
     * @description ask npm server who is local user with authToken
     */
    whoami ({
        registry = this.registry,
        authToken = this.authToken,
    }: CommandActionOptions<{
        authToken?: string
    }>): ErrableResponse<{
        username: string
    }> {
        return tryJSONParseHttpResponse(
            this.httpClient.get(`${registry}/-/whoami`, {
                headers: {
                    referer: 'whoami',
                    authorization: `Bearer ${authToken}`
                }
            })
        )
        
    };

    /**
     * @description search npm package on server
     */
    search ({
        registry = this.registry,
        authToken = this.authToken,
        offset = 0,
        size = 20,
        keyword = '',
        ...args
    }: CmderSearchActionParams): ErrableResponse<CmderSearchActionResult> {
        return tryJSONParseHttpResponse(
            this.httpClient.get(`${registry}/-/v1/search`, {
                query: {
                    text: keyword,
                    from: offset,
                    size,
                    quality: 0.65,
                    popularity: 0.98,
                    maintenance: 0.5,
                },
                headers: getHeaders({
                    ...args,
                    authToken,
                    referer: `search ${keyword}`,
                })
            })
        )
    }

    searchAndGetIndexedInfo (
        params: CmderSearchActionParams
    ): ErrableResponse<ISearchedPkgInfoWithDetail> {
        const searchResults = this.search(params);

        if (searchResults instanceof Error)
            return searchResults;

        const result = util.omit(searchResults, 'objects') as ISearchedPkgInfoWithDetail;

        let err: ErrableResponse<null> = null
        result.objects = coroutine.parallel(searchResults.objects, (searchedPkgInfo: ISearchPkgInfo) => {
            const indexedInfo = this.getNpmPackageIndexedInformationForExplorer({ pkgname: searchedPkgInfo.package.name })
            if (!err && (indexedInfo instanceof Error))
                err = indexedInfo;

            return {
                ...searchedPkgInfo,
                indexedInfo,
            };
        })

        if (err) return err;

        return result;
    }

    /**
     * @description audit installed npm packages(in node_modules directory generally)quickly
     * 
     * @no_test
     */
    quickSecurityAudits ({
        registry = this.registry,
        authToken = this.authToken,
        ...args
    }: CommandActionOptions<{
        /**
         * @description npm project's name to be audited
         */
        name: string
        /**
         * @description packages required by npm projects
         */
        requires: NpmPackageInfoAsDependency['requires']
        dependencies: {
            [depname: string]: NpmPackageInfoAsDependency
        }
    }>): ErrableResponse<{
        "actions": [],
        "advisories": {},
        "muted": [],
        "metadata": {
            "vulnerabilities": {
                "info": number,
                "low": number,
                "moderate": number,
                "high": number,
                "critical": number
            },
            "dependencies": number,
            "devDependencies": number,
            "optionalDependencies": number,
            "totalDependencies": number
        }
    }> {
        return tryJSONParseHttpResponse(
            this.httpClient.post(`${registry}/-/npm/v1/security/audits/quick`, {
                json: {
                    "install": [],
                    "remove": [],
                    "metadata": {
                        "npm_version": "",
                        "node_version": "",
                        "platform": process.platform
                    }
                },
                headers: getHeaders({
                    ...args,
                    authToken,
                    referer: `install`,
                })
            })
        )
    }

    getNpmPackageIndexedInformationForInstall ({
        pkgname,
        registry = this.registry,
        ...args
    }: CommandActionOptions<{
        pkgname: string
    }>): ErrableResponse<NpmPackageIndexedCriticalInfo> {
        return tryJSONParseHttpResponse(
            this.httpClient.get(`${registry}/${pkgname}`, {
                headers: getHeaders({
                    ...args,
                    /**
                     * @notice for npmjs.com, if you don't provide referer, it maybe treat
                     * this time access as from browser, so the response json could have
                     * fields `_id`, `_rev`, etc. which are not harmful but also pointless :)
                     */
                    referer: `install ${pkgname}`,
                })
            })
        )
    }

    getNpmPackageIndexedInformationForExplorer ({
        pkgname,
        registry = this.registry,
        ...args
    }: CommandActionOptions<{
        pkgname: string
    }>): ErrableResponse<NpmPackageInfoFromBrowser> {
        return tryJSONParseHttpResponse(
            this.httpClient.get(`${registry}/${pkgname}`, {
                headers: util.omit(
                    getHeaders({
                        ...args,
                        referer: undefined
                    }),
                    ['accept']
                )
            })
        )
    }

    getRequestedNpmPackageVersions ({
        target,
        ...args
    }: CommandActionOptions<{
        target: string
    }>) {
        const { type, pkgname, npm_semver, npm_tag, npm_semver_range } = parseInstallTarget(target)

        if (type !== 'npm')
            throw new Error(`type must be 'npm'! but ${type} given.`)

        const indexedInfo = this.getNpmPackageIndexedInformationForInstall({ pkgname, ...args })

        if (indexedInfo instanceof Error) return indexedInfo;

        return checkoutValidNpmPackageVersions({
            npm_semver, npm_tag, npm_semver_range
        }, Object.keys(indexedInfo.versions))
    }

    downloadNpmTarball ({
        registry = this.registry,
        target,
        ...args
    }: CommandActionOptions<{
        /**
         * @description install target
         * 
         * @sample 'typescript@latest' 
         * @sample 'fib-typify@latest'
         * @sample 'fib-typify@^0.8.x'
         */
        target: string
    }>) {
        const { type, pkgname, npm_semver, npm_tag } = parseInstallTarget(target)
        console.log(
            'parseInstallTarget(target)',
            parseInstallTarget(target)
        )

        if (type !== 'npm')
            throw new Error(`type must be 'npm'! but ${type} given.`)

        const semver = npm_semver || npm_tag

        return this.httpClient.get(`${registry}/${pkgname}`, {
            headers: getHeaders({
                ...args,
                referer: `install ${pkgname}@${semver}`,
                'pacote-req-type': 'tarball',
                'pacote-pkg-id': `registry:${pkgname}@${registry}/${pkgname}/-/${pkgname}-${semver}.tgz`,
            })
        })
    }
}
