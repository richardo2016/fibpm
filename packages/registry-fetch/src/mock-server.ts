/**
 * @author richardo2016@gmail.com
 * @email richardo2016@gmail.com
 * @create date 2021-05-06 17:08:01
 * @modify date 2021-05-06 17:08:01
 * 
 * @desc one mock server, inspired by `nock`
 */

import url = require('url');
import mq = require('mq');

type IHttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH';
type IRoutingMethod = 'get' | 'post' | 'put' | 'patch';

type IRouteList = ((req: Class_HttpRequest) => any | Class_Handler)[];

type IMatchHeaderFunc = (headerValues: string[] | null) => boolean;

const HTTP_STATUS_MESSAGE: {[p: number]: string} = {
    200: 'OK',
    400: 'Bad Request',
    401: 'Unauthorized',
}

type IMockServerReplyFunc = (
    httpCode: Class_HttpResponse['statusCode'],
    body: string | object,
    headers?: Record<string, string>,
    options?: {
        json?: boolean
    }
) => void
type IMockServerReplyParams = Parameters<IMockServerReplyFunc>;

export class MockServer {
    routing = new mq.Routing();
    subRoutings = new mq.Routing();

    _lastRoute: {
        path: string,
        method: IHttpVerb,
        routes: IRouteList;
    } = null;

    constructor(hostBase: string) {
        const { hostname, path = '' } = url.parse(hostBase);
        
        let obj: any
        if (path) {
            obj = new mq.Routing({
                [path]: this.subRoutings
            })
        } else {
            obj = this.subRoutings
        }
        
        this.routing.host(hostname, obj as any);
    }

    receive(req: Class_HttpRequest) {
        // @warning: never modify to this.routing.invoke(req)
        mq.invoke(this.routing, req);
    }

    _getLastRouteConf() {
        if (!this._lastRoute) {
            this._lastRoute = {
                path: null,
                method: 'GET',
                routes: []
            }
        }

        return this._lastRoute;
    }

    _clearLastRoute() {
        this._lastRoute = null;
    }

    _mount(path: string, method: IHttpVerb) {
        this._lastRoute = this._getLastRouteConf();
        this._lastRoute.path = path;
        this._lastRoute.method = method;

        return this
    }

    matchHeader(key: string, valueOrGetValue: string | IMatchHeaderFunc) {
        const func: IMatchHeaderFunc = typeof valueOrGetValue === 'function' ? valueOrGetValue
            : (headerValues) => headerValues[0] === valueOrGetValue

        const conf = this._getLastRouteConf()

        conf.routes.push((req) => {
            const headers = req.headers.all(key);
            if (!func(headers.length ? headers : null)) {
                req.end();
            }
        })

        return this;
    }

    get(path: string) {
        return this._mount(path, 'GET');
    }

    post(path: string) {
        return this._mount(path, 'POST');
    }

    reply(...args: IMockServerReplyParams | [IMockServerReplyFunc]) {        
        if (!this._lastRoute) {
            throw new Error(`[reply] no _lastRoute information! make you call '._mount' before call '.reply'`)
        }

        this._lastRoute.routes.push(
            (req: Class_HttpRequest) => {
                let params: IMockServerReplyParams
                if (typeof args[0] === 'function') {
                    params = args[0].apply(null, [req]);
                } else {
                    params = args as IMockServerReplyParams;
                }

                const [
                    httpCode,
                    body,
                    headers = {},
                    {
                        json = true
                    } = {}
                ] = params || [];

                req.response.setHeader(headers);              
                req.response.statusCode = httpCode;

                if (HTTP_STATUS_MESSAGE[httpCode]) {
                    req.response.statusMessage = HTTP_STATUS_MESSAGE[httpCode];
                } else {
                    throw new Error(`unsupport http status code ${httpCode}`);
                }
                
                if (typeof body === 'string') {
                    req.response.body.write(Buffer.from(body))
                    if (json) {
                        req.response.setHeader('Content-Type', 'application/json')
                    }
                } else {
                    req.response.json(body)
                }

                req.response.body.rewind()
            }
        );

        const method = this._lastRoute.method.toLowerCase() as IRoutingMethod;// as Lowercase<IHttpVerb>;

        this.subRoutings[method](this._lastRoute.path, this._lastRoute.routes as any);

        this._lastRoute = null;

        return this;
    }
}

export function nock (hostBase: string) {
    return new MockServer(hostBase);
}


