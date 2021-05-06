/**
 * @author richardo2016@gmail.com
 * @email richardo2016@gmail.com
 * @create date 2021-05-06 17:08:01
 * @modify date 2021-05-06 17:08:01
 *
 * @desc one mock server, inspired by `nock`
 */
/// <reference types="@fibjs/types" />
declare type IHttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH';
declare type IRouteList = ((req: Class_HttpRequest) => any | Class_Handler)[];
declare type IMatchHeaderFunc = (headerValues: string[] | null) => boolean;
export declare class MockServer {
    routing: Class_Routing;
    subRoutings: Class_Routing;
    _lastRoute: {
        path: string;
        method: IHttpVerb;
        routes: IRouteList;
    };
    constructor(hostBase: string);
    receive(req: Class_HttpRequest): void;
    _getLastRouteConf(): {
        path: string;
        method: IHttpVerb;
        routes: IRouteList;
    };
    _clearLastRoute(): void;
    _mount(path: string, method: IHttpVerb): this;
    matchHeader(key: string, valueOrGetValue: string | IMatchHeaderFunc): this;
    get(path: string): this;
    post(path: string): this;
    reply(httpCode: Class_HttpResponse['statusCode'], body: string | object, { json }?: {
        json?: boolean;
    }): this;
}
export declare function nock(hostBase: string): MockServer;
export {};
