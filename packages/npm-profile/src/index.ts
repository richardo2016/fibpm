'use strict'

import fetch = require('@fibpm/registry-fetch')
import { INpmHttpResponse } from '@fibpm/registry-fetch/typings/_types'
import { errors } from '@fibpm/registry-fetch';
const { HttpErrorBase } = errors
import os = require('os')
import url = require('url')
import http = require('http')
import coroutine = require('coroutine')

type IRegFetchOptions = Parameters<typeof fetch>[1] & {
    creds?: {
        username: string
        password: string
        email: string
    }
}

type IPrompter = (creds: IRegFetchOptions['creds']) => IRegFetchOptions['creds']
// try loginWeb, catch the "not supported" message and fall back to couch
export const login = (
    opener: string,
    prompter: IPrompter,
    opts: IRegFetchOptions = {}
) => {
    const { creds } = opts
    try {
        return loginWeb(opener, opts)
    } catch (er) {
        if (er instanceof WebLoginNotSupported) {
            //   process.emit('log', 'verbose', 'web login not supported, trying couch')
            const data = prompter(creds)

            return loginCouch(data.username, data.password, opts)
        } else {
            throw er
        }
    }
}

export const adduser = (opener: IOpener, prompter: IPrompter, opts: IRegFetchOptions = {}) => {
    const { creds } = opts
    try {
        return adduserWeb(opener, opts)
    } catch (er) {
        if (er instanceof WebLoginNotSupported) {
            // process.emit('log', 'verbose', 'web adduser not supported, trying couch')
            const data = prompter(creds)

            return adduserCouch(data.username, data.email, data.password, opts)
        } else {
            throw er
        }
    }
}

export const adduserWeb = (opener: IOpener, opts: IRegFetchOptions = {}) => {
    // process.emit('log', 'verbose', 'web adduser', 'before first POST')
    return webAuth(opener, opts, { create: true })
}

export const loginWeb = (opener: any, opts: IRegFetchOptions = {}) => {
    // process.emit('log', 'verbose', 'web login', 'before first POST')
    return webAuth(opener, opts, {})
}

const isValidUrl = (u: string) => {
    try {
        return /^https?:$/.test(url.parse(u).protocol)
    } catch (er) {
        return false
    }
}

type IOpener = any;
const webAuth = (opener: IOpener, opts: IRegFetchOptions & {
    hostname?: string
}, body: Record<string, any>) => {
    const { hostname } = opts
    body.hostname = hostname || os.hostname()

    try {
        const target = '/-/v1/login'
        let res = fetch(target, {
            ...opts,
            method: 'POST',
            body
        })

        const content = res.json();

        const { doneUrl, loginUrl } = content
        // process.emit('log', 'verbose', 'web auth', 'got response', content)
        if (!isValidUrl(doneUrl) || !isValidUrl(loginUrl)) {
            throw new WebLoginInvalidResponse('POST', res, content)
        }

        // process.emit('log', 'verbose', 'web auth', 'opening url pair')

        opener(loginUrl);
        return webAuthCheckLogin(doneUrl, { ...opts, cache: false });
    } catch (er) {
        // console.log('[webAuth] er is', er);
        // console.log('[webAuth] er.body is', er.body);

        if ((er.statusCode >= 400 && er.statusCode <= 499) || er.statusCode === 500) {
            const resp = new http.Response() as INpmHttpResponse;

            resp.statusCode = er.statusCode
            resp.setHeader(er.headers);

            throw new WebLoginNotSupported('POST', resp, er.body)
        } else {
            throw er
        }
    }
}

const webAuthCheckLogin = <T = any>(doneUrl: string, opts: IRegFetchOptions): T => {
    const res = fetch(doneUrl, opts);

    const content = res.json();

    if (res.statusCode === 200) {
        if (!content.token) {
            throw new WebLoginInvalidResponse('GET', res, content)
        } else {
            return content
        }
    } else if (res.statusCode === 202) {
        const retry = +res.headers.first('retry-after') * 1000
        if (retry > 0) {
            sleep(retry);
        }

        return webAuthCheckLogin(doneUrl, opts);
    } else {
        throw new WebLoginInvalidResponse('GET', res, content)
    }
}

export const adduserCouch = (
    username: string,
    email: string,
    password: string,
    opts: IRegFetchOptions = {}
) => {
    const body: {
        roles: string[]
    } & Record<string, any> = {
        _id: 'org.couchdb.user:' + username,
        name: username,
        password: password,
        email: email,
        type: 'user',
        roles: [],
        date: new Date().toISOString()
    }
    // const logObj = {
    //     ...body,
    //     password: 'XXXXX'
    // }
    //   process.emit('log', 'verbose', 'adduser', 'before first PUT', logObj)

    const target = '/-/user/org.couchdb.user:' + encodeURIComponent(username)
    const result = fetch.json(target, {
        ...opts,
        method: 'PUT',
        body
    });

    result.username = username
    return result
}

export const loginCouch = (username: string, password: string, opts: IRegFetchOptions = {}) => {
    const body: {
        roles: string[]
    } & Record<string, any> = {
        _id: 'org.couchdb.user:' + username,
        name: username,
        password: password,
        type: 'user',
        roles: [],
        date: new Date().toISOString()
    }
    // const logObj = {
    //     ...body,
    //     password: 'XXXXX'
    // }
    //   process.emit('log', 'verbose', 'login', 'before first PUT', logObj)
    let result: Record<string, any>;

    const target = '-/user/org.couchdb.user:' + encodeURIComponent(username)
    try {
        result = fetch.json(target, {
            ...opts,
            method: 'PUT',
            body
        })
    } catch (err) {
        if (err.code === 'E400') {
            err.message = `There is no user with the username "${username}".`
            throw err
        }
        if (err.code !== 'E409') throw err

        // result = fetch.json(target, {
        //     ...opts,
        //     query: { write: true }
        // })

        // Object.keys(result).forEach(k => {
        //     if (!body[k] || k === 'roles') {
        //         body[k] = result[k]
        //     }
        // })

        // result = fetch.json(`${target}/-rev/${body._rev}`, {
        //     ...opts,
        //     method: 'PUT',
        //     body,
        //     forceAuth: {
        //         username,
        //         password: Buffer.from(password, 'utf8').toString('base64'),
        //         otp: opts.otp
        //     }
        // })
    }

    result.username = username
    return result
}

export const get = (opts: IRegFetchOptions = {}) => fetch.json('/-/npm/v1/user', opts)

export const set = (profile: Record<string, string>, opts: IRegFetchOptions = {}) => {
    Object.keys(profile).forEach(key => {
        // profile keys can't be empty strings, but they CAN be null
        if (profile[key] === '') profile[key] = null
    })
    return fetch.json('/-/npm/v1/user', {
        ...opts,
        method: 'POST',
        body: profile
    })
}

export const listTokens = (opts: IRegFetchOptions = {}) => {
    const untilLastPage = (href: string, objects?: object[]): object[] => {
        const result = fetch.json(href, opts);

        objects = objects ? objects.concat(result.objects) : result.objects
        if (result.urls.next) {
            return untilLastPage(result.urls.next, objects)
        } else {
            return objects
        }
    }
    return untilLastPage('/-/npm/v1/tokens')
}

export const removeToken = (tokenKey: string, opts: IRegFetchOptions = {}): null => {
    const target = `/-/npm/v1/tokens/token/${tokenKey}`
    fetch(target, {
        ...opts,
        method: 'DELETE',
        ignoreBody: true
    })

    return null;
}

export const createToken = (password: string, readonly?: boolean, cidrs?: object[], opts = {}) => {
    return fetch.json('/-/npm/v1/tokens', {
        ...opts,
        method: 'POST',
        body: {
            password: password,
            readonly: readonly,
            cidr_whitelist: cidrs
        }
    })
}

class WebLoginInvalidResponse extends HttpErrorBase {
    constructor(...args: ConstcutorParamters<typeof errors.HttpErrorBase>) {
        super(...args);

        this.message = 'Invalid response from web login endpoint'
            ; (Error as any).captureStackTrace(this, WebLoginInvalidResponse)
    }
}

type ConstcutorParamters<T> = T extends {
    new(...args: infer U): void;
} ? U : never
class WebLoginNotSupported extends errors.HttpErrorBase {
    constructor(...args: ConstcutorParamters<typeof errors.HttpErrorBase>) {
        super(...args)
        this.message = 'Web login not supported'
        this.code = 'ENYI';

        ; (Error as any).captureStackTrace(this, WebLoginNotSupported)
    }
}

const sleep = (ms: number) => {
    coroutine.sleep(ms);
}