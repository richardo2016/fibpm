import { HttpErrorAuthOTP } from './errors'
import checkResponse = require('./check-response')
import getAuth, { IGetAuthOpts } from './auth';
import npa = require('npm-package-arg')
import http = require('http')
import qs = require('querystring')
import url = require('url')
import zlib = require('zlib')
import { MockServer } from './mock-server'

import defaultOpts, { IOptions } from './default-opts';
import { INpmHttpResponse, ISpecInOptions } from './_types';

// check if request url valid
const urlIsValid = (u: string) => {
    const parsed = url.parse(u);
    return !!(parsed.hostname && parsed.host)
}

type IRegFetchOptions = IOptions & IGetCacheModeOpts & {
    spec?: ISpecInOptions
    otp?: string
    body?: object
    gzip?: boolean
    query?: object
    otpPrompt?: () => string
};
type IMockResponse = (req: Class_HttpRequest) => void;
/**
 * @description fetch function, support fake
 * @param uri 
 * @param opts_ 
 * @returns 
 */
function regFetch(
    uri: string,
    opts_: IRegFetchOptions,
    onRequest?: IMockResponse
): INpmHttpResponse {
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

    if (body && typeof body === 'object') {
        headers['content-type'] = headers['content-type'] || 'application/json'
        body = JSON.stringify(body)
    } else if (body && !headers['content-type']) {
        headers['content-type'] = 'application/octet-stream'
    }

    if (opts.gzip) {
        headers['content-encoding'] = 'gzip'
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

    let resp: INpmHttpResponse;

    if (onRequest) {
        httpRequest.method = opts.method;
        httpRequest.setHeader(headers);
        httpRequest.addHeader('HOST', parsed.hostname)
        httpRequest.value = parsed.path;
        
        httpRequest.body.write(body as any);

        onRequest(httpRequest);

        resp = httpRequest.response as INpmHttpResponse;
    } else {
        const client = new http.Client();
        resp = client.request(opts.method, uri, {
            body,
            headers,
        }) as INpmHttpResponse;
    }

    resp.url = uri;

    try {
        checkResponse({
            method,
            uri,
            res: resp,
            registry,
            startTime,
            auth,
            opts,
        });
    } catch (error) {
        if (error instanceof HttpErrorAuthOTP && typeof opts.otpPrompt === 'function') {
            // if otp fails to complete, we fail with that failure
            const otp = opts.otpPrompt()
            // if no otp provided, throw the original HTTP error
            if (!otp)
                throw error

            return regFetch(uri, { ...opts, otp }, onRequest)
        }

        throw error;
    }

    return resp
}

export = regFetch;

regFetch.mock = (uri: string, opts: IRegFetchOptions, mockResponse: MockServer | IMockResponse) => {
    return regFetch(uri, opts, mockResponse instanceof MockServer ? req => mockResponse.receive(req) : mockResponse);
}

regFetch.json = (uri: string, opts: IRegFetchOptions) => {
  return regFetch(uri, opts).json();
}

regFetch.jsonMock = (uri: string, opts: IRegFetchOptions, mockResponse: MockServer | IMockResponse) => {
    return regFetch.mock(uri, opts, mockResponse).json();
}

/**
 * @description pick registry for spec from npm configuration
 */
function pickRegistry(
    _spec: ISpecInOptions,
    opts: Record<string, string> & {
        scope?: string
    } = {}
) {
    const spec = npa(_spec as any)
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
// TODO: support it
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