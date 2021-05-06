import url = require('url')
import { ISpecInOptions } from './_types'

function packageName(href: string): string | undefined {
    try {
        let basePath: string | string[] = url.parse(href).pathname.substr(1)
        if (!basePath.match(/^-/)) {
            basePath = basePath.split('/')
            var index = basePath.indexOf('_rewrite')
            if (index === -1)
                index = basePath.length - 1
            else
                index++
            return decodeURIComponent(basePath[index])
        }
    } catch (_) {
        // this is ok
    }
}

type IErrorOpts = {
    url?: string,
    spec?: ISpecInOptions
};

type IBodyError = Class_Buffer & {
    error?: string
}

export class HttpErrorBase extends Error {
    name: string
    headers: Record<string, string>
    statusCode: number
    code: string
    method: string
    uri: string
    body: Class_Buffer | IBodyError
    pkgid: string

    constructor(
        method: string,
        res: Class_HttpResponse,
        body: IBodyError,
        opts: IErrorOpts
    ) {
        super()
        this.name = this.constructor.name
        this.headers = res.headers.toJSON()
        this.statusCode = res.statusCode
        this.code = `E${res.statusCode}`
        this.method = method
        this.uri = opts?.url
        this.body = body || res.body.readAll();
        // res.body.readAll()
        this.pkgid = opts?.spec ? opts?.spec.toString() : packageName(opts?.url)
    }
}

export class HttpErrorGeneral extends HttpErrorBase {
    spec: string
    constructor(
        method: string,
        res: Class_HttpResponse,
        body: IBodyError,
        opts: IErrorOpts
    ) {
        super(method, res, body, opts)
        this.message = `${res.statusCode} ${res.statusMessage} - ${this.method.toUpperCase()
            } ${this.spec || this.uri
            }${(body && body.error) ? ' - ' + body.error : ''
            }`

        ;(Error as any).captureStackTrace(this, HttpErrorGeneral)
    }
}

export class HttpErrorAuthOTP extends HttpErrorBase {
    constructor(
        method: string,
        res: Class_HttpResponse,
        body: IBodyError,
        opts: IErrorOpts
    ) {
        super(method, res, body, opts)
        this.message = 'OTP required for authentication'
        this.code = 'EOTP'

        ;(Error as any).captureStackTrace(this, HttpErrorAuthOTP)
    }
}

export class HttpErrorAuthIPAddress extends HttpErrorBase {
    constructor(
        method: string,
        res: Class_HttpResponse,
        body: IBodyError,
        opts: IErrorOpts
    ) {
        super(method, res, body, opts)
        this.message = 'Login is not allowed from your IP address'
        this.code = 'EAUTHIP'

        ;(Error as any).captureStackTrace(this, HttpErrorAuthIPAddress)
    }
}

export class HttpErrorAuthUnknown extends HttpErrorBase {
    constructor(
        method: string,
        res: Class_HttpResponse,
        body: IBodyError,
        opts: IErrorOpts
    ) {
        super(method, res, body, opts)
        this.message = 'Unable to authenticate, need: ' + res.headers.first('www-authenticate')

        ;(Error as any).captureStackTrace(this, HttpErrorAuthUnknown)
    }
}