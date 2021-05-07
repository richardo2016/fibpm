/// <reference types="@fibjs/types" />
import { MockServer } from './mock-server';
import { IOptions } from './default-opts';
import { INpmHttpResponse, ISpecInOptions } from './_types';
declare type IRegFetchOptions = IOptions & IGetCacheModeOpts & {
    spec?: ISpecInOptions;
    otp?: string;
    body?: object;
    gzip?: boolean;
    query?: object;
    otpPrompt?: () => string;
};
declare type IMockResponse = (req: Class_HttpRequest) => void;
/**
 * @description fetch function, support fake
 * @param uri
 * @param opts_
 * @returns
 */
declare function regFetch(uri: string, opts_: IRegFetchOptions, onRequest?: IMockResponse): INpmHttpResponse;
declare namespace regFetch {
    var mock: (uri: string, opts: IRegFetchOptions, mockResponse: MockServer | IMockResponse) => INpmHttpResponse;
    var json: (uri: string, opts: IRegFetchOptions) => any;
    var jsonMock: (uri: string, opts: IRegFetchOptions, mockResponse: MockServer | IMockResponse) => any;
    var pickRegistry: (_spec: ISpecInOptions, opts?: Record<string, string> & {
        scope?: string;
    }) => string;
}
export = regFetch;
declare type IGetCacheModeOpts = {
    offline?: boolean;
    preferOffline?: boolean;
    preferOnline?: boolean;
};
