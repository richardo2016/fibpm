import errors = require('./errors')
import util = require('util')
import _url = require('url')
import defaultOpts, { IOptions } from './default-opts'

import IGetAuth from './auth';
import { INpmHttpResponse, ISpecInOptions } from './_types'
import { makeAuthMissingLog } from './silentlog';

type ICheckResponseOpts = Partial<IOptions> & {
    ignoreBody?: boolean
    spec?: ISpecInOptions
    url?: string
}

type IResponseInfo = {
    method: IOptions['method'],
    uri: string,
    res: INpmHttpResponse,
    registry: string,
    startTime: number,
    auth: ReturnType<typeof IGetAuth>,
    opts: ICheckResponseOpts
};

const checkResponse = ({
    method,
    uri,
    res,
    registry,
    startTime,
    auth,
    opts
}: IResponseInfo) => {
    opts = { ...defaultOpts, ...opts }
    if (res.headers.has('npm-notice') && !res.headers.has('x-local-cache'))
        opts.log.notice('', res.headers.first('npm-notice'))

    checkWarnings(res, registry, opts)
    if (res.statusCode >= 400) {
        logRequest(method, res, startTime, opts)
        if (auth && auth.scopeAuthKey && !auth.token && !auth.auth) {

            // we didn't have auth for THIS request, but we do have auth for
            // requests to the registry indicated by the spec's scope value.
            // Warn the user.
            opts.log.warn('registry', makeAuthMissingLog(uri, auth.scopeAuthKey))
        }
        return checkErrors(method, res, startTime, { ...opts, url: uri })
    } else {
        // TODO: it record end time of response, maybe fibjs should support listeners on http stream 'end'
        logRequest(method, res, startTime, opts)
        if (opts.ignoreBody) {
            res.body.truncate(0);
        }
        return res
    }
}
export = checkResponse

function logRequest(
    method: IOptions['method'],
    res: INpmHttpResponse,
    startTime: number,
    opts: ICheckResponseOpts
) {
    const elapsedTime = Date.now() - startTime
    const attempt = res.headers.first('x-fetch-attempts')
    const attemptStr = attempt && attempt > 1 ? ` attempt #${attempt}` : ''
    const cacheStr = res.headers.first('x-local-cache') ? ' (from cache)' : ''

    let urlStr
    try {
        const url = _url.parse(opts.url || res.url)
        if (url.password)
            url.password = '***'

        urlStr = url.toString()
    } catch (er) {
        urlStr = opts.url
    }

    opts.log.http(
        'fetch',
        `${method.toUpperCase()} ${res.statusCode} ${urlStr} ${elapsedTime}ms${attemptStr}${cacheStr}`
    )
}

const WARNING_REGEXP = /^\s*(\d{3})\s+(\S+)\s+"(.*)"\s+"([^"]+)"/
const BAD_HOSTS = new util.LruCache(50)

function arraify<T>(itemOrList: T | T[]): T[] {
    return Array.isArray(itemOrList) ? itemOrList : [itemOrList];
}

function checkWarnings(
    res: INpmHttpResponse,
    registry: string,
    opts: ICheckResponseOpts
) {
    if (res.headers.has('warning') && !BAD_HOSTS.has(registry)) {
        const warnings: Record<string, any> = {}
        // note: value will preserve case, so we might have a
        // key on the object like 'WaRnInG' if that was used first
        for (const [key, value] of Object.entries(res.headers.all() as { [k: string]: string | string[] })) {
            if (key.toLowerCase() !== 'warning')
                continue

            const values = arraify(value);

            values.forEach(w => {
                const match = w.match(WARNING_REGEXP)
                if (match) {
                    warnings[match[1]] = {
                        code: match[1],
                        host: match[2],
                        message: match[3],
                        date: new Date(match[4]),
                    }
                }
            })
        }
        BAD_HOSTS.set(registry, true)
        if (warnings['199']) {
            if (warnings['199'].message.match(/ENOTFOUND/))
                opts.log.warn('registry', `Using stale data from ${registry} because the host is inaccessible -- are you offline?`)
            else
                opts.log.warn('registry', `Unexpected warning for ${registry}: ${warnings['199'].message}`)
        }
        if (warnings['111']) {
            // 111 Revalidation failed -- we're using stale data
            opts.log.warn(
                'registry',
                `Using stale data from ${registry} due to a request error during revalidation.`
            )
        }
    }
}

function checkErrors(
    method: IOptions['method'],
    res: INpmHttpResponse,
    startTime: number,
    opts: ICheckResponseOpts
) {
    let parsed = null;

    let body = res.body.readAll();
    res.body.rewind();

    try {
        parsed = JSON.parse(body.toString('utf8'));
    } catch (e) { }

    if (res.statusCode === 401 && res.headers.first('www-authenticate')) {
        const auth = res.headers.first('www-authenticate')
            .split(/,\s*/)
            .map((s: string) => s.toLowerCase())
        if (auth.indexOf('ipaddress') !== -1) {
            throw new errors.HttpErrorAuthIPAddress(
                method, res, parsed, opts
            )
        } else if (auth.indexOf('otp') !== -1) {
            throw new errors.HttpErrorAuthOTP(
                method, res, parsed, opts
            )
        } else {
            throw new errors.HttpErrorAuthUnknown(
                method, res, parsed, opts
            )
        }
    } else if (res.statusCode === 401 && body != null && /one-time pass/.test(body.toString('utf8'))) {
        // Heuristic for malformed OTP responses that don't include the www-authenticate header.
        throw new errors.HttpErrorAuthOTP(
            method, res, parsed, opts
        )
    } else {
        throw new errors.HttpErrorGeneral(
            method, res, parsed, opts
        )
    }
}