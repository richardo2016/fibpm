/// <reference types="@fibjs/types" />
import { IGetAuthOpts } from './auth';
import { IOptions } from './default-opts';
declare type IRegFetchOptions = IOptions & IGetAuthOpts & IGetCacheModeOpts & {
    spec?: string;
    body?: object;
    gzip?: boolean;
    query?: object;
};
declare type IMockResponse = (req: Class_HttpRequest) => void;
/**
 * @description fetch function, support fake
 * @param uri
 * @param opts_
 * @returns
 */
declare function regFetch(uri: string, opts_: IRegFetchOptions, onRequest?: IMockResponse): Class_HttpResponse;
declare namespace regFetch {
    var json: (uri: string, opts: IRegFetchOptions) => any;
    var jsonMock: (uri: string, opts: IRegFetchOptions, mockResponse: IMockResponse) => any;
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
