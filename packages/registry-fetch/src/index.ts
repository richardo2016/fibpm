import { HttpErrorAuthOTP } from './errors'
import checkResponse = require('./check-response')
import getAuth, { IGetAuthOpts } from './auth';
// import fetch = require('make-fetch-happen')
// import JSONStream = require('minipass-json-stream')
import npa = require('npm-package-arg')
import http = require('http')
import qs = require('querystring')
import url = require('url')
// import zlib = require('minizlib')
import zlib = require('zlib')

import defaultOpts, { IOptions } from './default-opts';
import type { MockServer } from './mock-server';

// check if request url valid
const urlIsValid = (u: string) => {
    const parsed = url.parse(u);
    return !!(parsed.hostname && parsed.host)
}

type IRegFetchOptions = IOptions & IGetAuthOpts & IGetCacheModeOpts & {
    spec?: string
    body?: object
    gzip?: boolean
    query?: object
};
/**
 * @description fetch function, support fake
 * @param uri 
 * @param opts_ 
 * @returns 
 */
function regFetch(
    uri: string,
    opts_: IRegFetchOptions
) {
    const opts = {
        ...defaultOpts,
        ...opts_,
    }

    // if we did not get a fully qualified URI, then we look at the registry
    // config or relevant scope to resolve it.
    const uriValid = urlIsValid(uri)
    let registry = opts.registry || defaultOpts.registry
    if (!uriValid) {
        registry = opts.registry = (
            (opts.spec && pickRegistry(opts.spec, opts as any)) ||
            opts.registry ||
            registry
        )
        uri = `${registry.trim().replace(/\/?$/g, '')
            }/${uri.trim().replace(/^\//, '')
            }`
        // asserts that this is now valid
        new url.URL(uri)
    }

    const method = opts.method || 'GET'

    const httpRequest = new http.Request();

    // through that takes into account the scope, the prefix of `uri`, etc
    const startTime = Date.now()
    const auth = getAuth(uri, opts as any)
    const headers = getHeaders(uri, auth, opts)
    let body: Class_Buffer | object | string = opts.body
    //   const bodyIsStream = Minipass.isStream(body)
    //   const bodyIsPromise = body &&
    //     typeof body === 'object' &&
    //     typeof body.then === 'function'

    if (body && typeof body === 'object') {
        headers['content-type'] = headers['content-type'] || 'application/json'
        body = JSON.stringify(body)
    } else if (body && !headers['content-type']) {
        headers['content-type'] = 'application/octet-stream'
    }
    //   if (body && !bodyIsStream && !bodyIsPromise && typeof body !== 'string' && !Buffer.isBuffer(body)) {
    //     headers['content-type'] = headers['content-type'] || 'application/json'
    //     body = JSON.stringify(body)
    //   } else if (body && !headers['content-type'])
    //     headers['content-type'] = 'application/octet-stream'

    if (opts.gzip) {
        headers['content-encoding'] = 'gzip'
        // TODO: 可能有问题
        body = zlib.gzip(Buffer.from(body.toString()));
    }

    const parsed = new url.URL(uri)

    if (opts.query) {
        const q = (typeof opts.query === 'string' ? qs.parse(opts.query)
            : opts.query) as Record<string, string>

        Object.keys(q).forEach(key => {
            if (q[key] !== undefined)
                parsed.searchParams.set(key, q[key])
        })
        uri = url.format(parsed)
    }

    if (parsed.searchParams.first('write') === 'true' && method === 'GET') {
        // do not cache, because this GET is fetching a rev that will be
        // used for a subsequent PUT or DELETE, so we need to conditionally
        // update cache.
        opts.offline = false
        opts.preferOffline = false
        opts.preferOnline = true
    }

    httpRequest.method = opts.method;
    httpRequest.setHeader(headers);
    httpRequest.addHeader('HOST', parsed.hostname)
    httpRequest.value = parsed.path;
    // console.log("parsed.hostname", parsed.hostname);
    // console.log("parsed.path", parsed.path);
    
    httpRequest.body.write(body as any);

    // return fake http request
    return httpRequest;


    // const p = fetch(uri, {
    //     agent: opts.agent,
    //     algorithms: opts.algorithms,
    //     body,
    //     cache: getCacheMode(opts),
    //     cacheManager: opts.cache,
    //     ca: opts.ca,
    //     cert: opts.cert,
    //     headers,
    //     integrity: opts.integrity,
    //     key: opts.key,
    //     localAddress: opts.localAddress,
    //     maxSockets: opts.maxSockets,
    //     memoize: opts.memoize,
    //     method: method,
    //     noProxy: opts.noProxy,
    //     proxy: opts.httpsProxy || opts.proxy,
    //     retry: opts.retry ? opts.retry : {
    //         retries: opts.fetchRetries,
    //         factor: opts.fetchRetryFactor,
    //         minTimeout: opts.fetchRetryMintimeout,
    //         maxTimeout: opts.fetchRetryMaxtimeout,
    //     },
    //     strictSSL: opts.strictSSL,
    //     timeout: opts.timeout || 30 * 1000,
    // }).then(res => checkResponse({
    //     method,
    //     uri,
    //     res,
    //     registry,
    //     startTime,
    //     auth,
    //     opts,
    // }))

    // const client = new http.Client();
    // client.request(opts.method, uri, {
    //     body:
    // })

    // if (typeof opts.otpPrompt === 'function') {
    //     return p.catch(async er => {
    //         if (er instanceof HttpErrorAuthOTP) {
    //             // if otp fails to complete, we fail with that failure
    //             const otp = await opts.otpPrompt()
    //             // if no otp provided, throw the original HTTP error
    //             if (!otp)
    //                 throw er
    //             return regFetch(uri, { ...opts, otp })
    //         }
    //         throw er
    //     })
    // } else
    //     return p
}

export = regFetch;

regFetch.json = (uri: string, opts: IRegFetchOptions) => {
  return regFetch(uri, opts)
//   .then(res => res.json())
}

regFetch.jsonMock = (uri: string, opts: IRegFetchOptions) => {
    const req = regFetch(uri, opts);

    return {
        pipe: (ms: MockServer) => ms.receive(req)
    }
}

// fetchJSON.stream = fetchJSONStream
// function fetchJSONStream (uri, jsonPath, /* istanbul ignore next */ opts_ = {}) {
//   const opts = { ...defaultOpts, ...opts_ }
//   const parser = JSONStream.parse(jsonPath, opts.mapJSON)
//   regFetch(uri, opts).then(res =>
//     res.body.on('error',
//       /* istanbul ignore next: unlikely and difficult to test */
//       er => parser.emit('error', er)).pipe(parser)
//   ).catch(er => parser.emit('error', er))
//   return parser
// }

function pickRegistry(
    _spec: string,
    opts: Record<string, string> & {
        scope?: string
    } = {}
) {
    const spec = npa(_spec)
    let registry = spec.scope &&
        opts[spec.scope.replace(/^@?/, '@') + ':registry']

    if (!registry && opts.scope)
        registry = opts[opts.scope.replace(/^@?/, '@') + ':registry']

    if (!registry)
        registry = opts.registry || defaultOpts.registry

    return registry
}

regFetch.pickRegistry = pickRegistry;

type IGetCacheModeOpts = {
    offline?: boolean
    preferOffline?: boolean
    preferOnline?: boolean
};
function getCacheMode(opts: IGetCacheModeOpts) {
    return opts.offline ? 'only-if-cached'
        : opts.preferOffline ? 'force-cache'
            : opts.preferOnline ? 'no-cache'
                : 'default'
}

function getHeaders(
    uri: string,
    auth: ReturnType<typeof getAuth>,
    opts: {
        headers?: Record<string, string>,
        userAgent?: IOptions['userAgent'],
        projectScope?: string
        npmSession?: string
        npmCommand?: string
        otp?: string
    }
) {
    const headers = Object.assign({
        'user-agent': opts.userAgent,
    }, opts.headers || {})

    if (opts.projectScope)
        headers['npm-scope'] = opts.projectScope

    if (opts.npmSession)
        headers['npm-session'] = opts.npmSession

    if (opts.npmCommand)
        headers['npm-command'] = opts.npmCommand

    // If a tarball is hosted on a different place than the manifest, only send
    // credentials on `alwaysAuth`
    if (auth.token)
        headers.authorization = `Bearer ${auth.token}`
    else if (auth.auth)
        headers.authorization = `Basic ${auth.auth}`

    if (opts.otp)
        headers['npm-otp'] = opts.otp

    return headers
}