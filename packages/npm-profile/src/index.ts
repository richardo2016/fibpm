'use strict'

import fetch = require('@fibpm/registry-fetch')
const { HttpErrorBase } = require('@fibpm/registry-fetch/lib/errors')
import os = require('os')
// import { URL } = require('url')

type IRegFetchOptions = Parameters<typeof fetch>[1]

// // try loginWeb, catch the "not supported" message and fall back to couch
// export const login = (opener, prompter, opts = {}) => {
//   const { creds } = opts
//   return loginWeb(opener, opts).catch(er => {
//     if (er instanceof WebLoginNotSupported) {
//       process.emit('log', 'verbose', 'web login not supported, trying couch')
//       return prompter(creds)
//         .then(data => loginCouch(data.username, data.password, opts))
//     } else {
//       throw er
//     }
//   })
// }

// export const adduser = (opener, prompter, opts = {}) => {
//   const { creds } = opts
//   return adduserWeb(opener, opts).catch(er => {
//     if (er instanceof WebLoginNotSupported) {
//       process.emit('log', 'verbose', 'web adduser not supported, trying couch')
//       return prompter(creds)
//         .then(data => adduserCouch(data.username, data.email, data.password, opts))
//     } else {
//       throw er
//     }
//   })
// }

// export const adduserWeb = (opener, opts = {}) => {
//   process.emit('log', 'verbose', 'web adduser', 'before first POST')
//   return webAuth(opener, opts, { create: true })
// }

// export const loginWeb = (opener, opts = {}) => {
//   process.emit('log', 'verbose', 'web login', 'before first POST')
//   return webAuth(opener, opts, {})
// }

// const isValidUrl = u => {
//   try {
//     return /^https?:$/.test(new URL(u).protocol)
//   } catch (er) {
//     return false
//   }
// }

// const webAuth = (opener, opts, body) => {
//   const { hostname } = opts
//   body.hostname = hostname || os.hostname()
//   const target = '/-/v1/login'
//   return fetch(target, {
//     ...opts,
//     method: 'POST',
//     body
//   }).then(res => {
//     return Promise.all([res, res.json()])
//   }).then(([res, content]) => {
//     const { doneUrl, loginUrl } = content
//     process.emit('log', 'verbose', 'web auth', 'got response', content)
//     if (!isValidUrl(doneUrl) || !isValidUrl(loginUrl)) {
//       throw new WebLoginInvalidResponse('POST', res, content)
//     }
//     return content
//   }).then(({ doneUrl, loginUrl }) => {
//     process.emit('log', 'verbose', 'web auth', 'opening url pair')
//     return opener(loginUrl).then(
//       () => webAuthCheckLogin(doneUrl, { ...opts, cache: false })
//     )
//   }).catch(er => {
//     if ((er.statusCode >= 400 && er.statusCode <= 499) || er.statusCode === 500) {
//       throw new WebLoginNotSupported('POST', {
//         status: er.statusCode,
//         headers: { raw: () => er.headers }
//       }, er.body)
//     } else {
//       throw er
//     }
//   })
// }

// const webAuthCheckLogin = (doneUrl, opts) => {
//   return fetch(doneUrl, opts).then(res => {
//     return Promise.all([res, res.json()])
//   }).then(([res, content]) => {
//     if (res.status === 200) {
//       if (!content.token) {
//         throw new WebLoginInvalidResponse('GET', res, content)
//       } else {
//         return content
//       }
//     } else if (res.status === 202) {
//       const retry = +res.headers.get('retry-after') * 1000
//       if (retry > 0) {
//         return sleep(retry).then(() => webAuthCheckLogin(doneUrl, opts))
//       } else {
//         return webAuthCheckLogin(doneUrl, opts)
//       }
//     } else {
//       throw new WebLoginInvalidResponse('GET', res, content)
//     }
//   })
// }

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

// export const listTokens = (opts = {}) => {
//   const untilLastPage = (href, objects) => {
//     return fetch.json(href, opts).then(result => {
//       objects = objects ? objects.concat(result.objects) : result.objects
//       if (result.urls.next) {
//         return untilLastPage(result.urls.next, objects)
//       } else {
//         return objects
//       }
//     })
//   }
//   return untilLastPage('/-/npm/v1/tokens')
// }

// export const removeToken = (tokenKey, opts = {}) => {
//   const target = `/-/npm/v1/tokens/token/${tokenKey}`
//   return fetch(target, {
//     ...opts,
//     method: 'DELETE',
//     ignoreBody: true
//   }).then(() => null)
// }

// export const createToken = (password, readonly, cidrs, opts = {}) => {
//   return fetch.json('/-/npm/v1/tokens', {
//     ...opts,
//     method: 'POST',
//     body: {
//       password: password,
//       readonly: readonly,
//       cidr_whitelist: cidrs
//     }
//   })
// }

// class WebLoginInvalidResponse extends HttpErrorBase {
//   constructor (method, res, body) {
//     super(method, res, body)
//     this.message = 'Invalid response from web login endpoint'
//     Error.captureStackTrace(this, WebLoginInvalidResponse)
//   }
// }

// class WebLoginNotSupported extends HttpErrorBase {
//   constructor (method, res, body) {
//     super(method, res, body)
//     this.message = 'Web login not supported'
//     this.code = 'ENYI'
//     Error.captureStackTrace(this, WebLoginNotSupported)
//   }
// }

// const sleep = (ms) =>
//   new Promise((resolve, reject) => setTimeout(resolve, ms))