/**
 * @author richardo2016@gmail.com
 * @email richardo2016@gmail.com
 * @create date 2021-05-06 17:08:01
 * @modify date 2021-05-06 17:08:01
 *
 * @desc one mock server, inspired by `nock`
 */
/// <reference types="@fibjs/types" />
declare type IHttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
declare type IRouteList = ((req: Class_HttpRequest) => any | Class_Handler)[];
declare type IMatchHeaderFunc = (headerValues: string[] | null) => boolean;
declare type IMockServerReplyFunc = (httpCode: Class_HttpResponse['statusCode'], body: string | object, headers?: Record<string, string>, options?: {
    json?: boolean;
}) => void;
declare type IMockServerReplyParams = Parameters<IMockServerReplyFunc>;
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
    put(path: string): this;
    patch(path: string): this;
    delete(path: string): this;
    reply(...args: IMockServerReplyParams | [IMockServerReplyFunc]): this;
}
export declare function nock(hostBase: string): MockServer;
export {};
