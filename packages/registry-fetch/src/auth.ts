/**
 * @author richardo2016@gmail.com
 * @email richardo2016@gmail.com
 * @create date 2021-05-06 15:49:30
 * @modify date 2021-05-06 15:49:30
 * 
 * @desc generate information about authentication
 */
import url = require('url');

import npa = require('npm-package-arg')
import { IOptions } from './default-opts';

/** @description specifiction of package, such as `foo@2.0.0` */
type IPackageSpec = string
type IKvs = Record<string, string>

// Find the longest registry key that is used for some kind of auth
// in the options.
function regKeyFromURI(uri: string, opts: IKvs) {
    const parsed = url.parse(uri);
    // try to find a config key indicating we have auth for this registry
    // can be one of :_authToken, :_auth, or :_password and :username
    // We walk up the "path" until we're left with just //<host>[:<port>],
    // stopping when we reach '//'.
    let regKey = `//${parsed.host}${parsed.pathname}`
    while (regKey.length > '//'.length) {
        // got some auth for this URI
        if (hasAuth(regKey, opts))
            return regKey

        // can be either //host/some/path/:_auth or //host/some/path:_auth
        // walk up by removing EITHER what's after the slash OR the slash itself
        regKey = regKey.replace(/([^/]+|\/)$/, '')
    }
}

const hasAuth = (regKey: string, opts: Record<string, string>) => (
    opts[`${regKey}:_authToken`] ||
    opts[`${regKey}:_auth`] ||
    opts[`${regKey}:username`] && opts[`${regKey}:_password`]
)

const sameHost = (a: string, b: string) => {
    const parsedA = url.parse(a);
    const parsedB = url.parse(b);
    return parsedA.host === parsedB.host
}

const getRegistry = (opts: IKvs & {
    spec?: IPackageSpec,
    registry?: string,
}) => {
    const { spec } = opts
    const { scope: specScope, subSpec } = (spec ? npa(spec) : {}) as (Partial<npa.Result> & { subSpec?: { scope: string } })
    const subSpecScope = subSpec && subSpec.scope
    const scope = subSpec ? subSpecScope : specScope
    const scopeReg = scope && opts[`${scope}:registry`]
    return scopeReg || opts.registry
}

export type IGetAuthOpts = IKvs & {
    log?: IOptions['log']
    forceAuth?: IKvs
}

const getAuth = (uri: string, opts: IGetAuthOpts = {}): Auth => {
    const { forceAuth } = opts
    if (!uri)
        throw new Error('URI is required')
    const regKey = regKeyFromURI(uri, forceAuth || opts)

    // we are only allowed to use what's in forceAuth if specified
    if (forceAuth && !regKey) {
        return new Auth({
            scopeAuthKey: null,
            token: forceAuth._authToken,
            username: forceAuth.username,
            password: forceAuth._password || forceAuth.password,
            auth: forceAuth._auth || forceAuth.auth,
        })
    }

    // no auth for this URI, but might have it for the registry
    if (!regKey) {
        const registry = getRegistry(opts)
        if (registry && uri !== registry && sameHost(uri, registry))
            return getAuth(registry, opts)
        else if (registry !== opts.registry) {
            // If making a tarball request to a different base URI than the
            // registry where we logged in, but the same auth SHOULD be sent
            // to that artifact host, then we track where it was coming in from,
            // and warn the user if we get a 4xx error on it.
            const scopeAuthKey = regKeyFromURI(registry, opts)
            return new Auth({ scopeAuthKey })
        }
    }

    const {
        [`${regKey}:_authToken`]: token,
        [`${regKey}:username`]: username,
        [`${regKey}:_password`]: password,
        [`${regKey}:_auth`]: auth,
    } = opts

    return new Auth({
        scopeAuthKey: null,
        token,
        auth,
        username,
        password,
    })
}

type IRequiredTuple = [
    {token?: string},
    {auth?: string},
    {
        username?: string
        password?: string
    },
]

type IAuthConstructorOpts = {
    scopeAuthKey?: string
} & IRequiredTuple[0] & IRequiredTuple[1] & IRequiredTuple[2]

/**
 * @description you should provide one of `IRequiredTuple`
 */
class Auth {
    scopeAuthKey
    token?: string
    auth?: string
    isBasicAuth: boolean

    constructor({ token, auth, username, password, scopeAuthKey }: IAuthConstructorOpts) {
        this.scopeAuthKey = scopeAuthKey
        this.token = null
        this.auth = null
        this.isBasicAuth = false
        if (token)
            this.token = token
        else if (auth)
            this.auth = auth
        else if (username && password) {
            const p = Buffer.from(password, 'base64').toString('utf8')
            this.auth = Buffer.from(`${username}:${p}`, 'utf8').toString('base64')
            this.isBasicAuth = true
        }
    }
}

export default getAuth;