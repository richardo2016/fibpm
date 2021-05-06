/// <reference types="@fibjs/types" />
import { IGetAuthOpts } from './auth';
import { IOptions } from './default-opts';
import type { MockServer } from './mock-server';
declare type IRegFetchOptions = IOptions & IGetAuthOpts & IGetCacheModeOpts & {
    spec?: string;
    body?: object;
    gzip?: boolean;
    query?: object;
};
/**
 * @description fetch function, support fake
 * @param uri
 * @param opts_
 * @returns
 */
declare function regFetch(uri: string, opts_: IRegFetchOptions): Class_HttpRequest;
declare namespace regFetch {
    var json: (uri: string, opts: IRegFetchOptions) => Class_HttpRequest;
    var jsonMock: (uri: string, opts: IRegFetchOptions) => {
        pipe: (ms: MockServer) => {
            pipe: (func: (buf: Class_Buffer, resp: Class_HttpResponse) => void) => void;
        };
    };
    var pickRegistry: (_spec: string, opts?: Record<string, string> & {
        scope?: string;
    }) => string;
}
export = regFetch;
declare type IGetCacheModeOpts = {
    offline?: boolean;
    preferOffline?: boolean;
    preferOnline?: boolean;
};
