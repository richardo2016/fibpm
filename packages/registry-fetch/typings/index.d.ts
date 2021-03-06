/// <reference types="@fibjs/types" />
import { IGetAuthOpts } from './auth';
import { MockServer } from '@fibpm/idev-mock-server';
import { IOptions } from './default-opts';
import { INpmHttpResponse, ISpecInOptions } from './_types';
declare type IRegFetchOptions = Partial<IOptions> & Partial<IGetCacheModeOpts> & Partial<IGetHeadersOptions> & Partial<IGetAuthOpts> & {
    spec?: ISpecInOptions;
    otp?: string;
    body?: object;
    gzip?: boolean;
    query?: object;
    otpPrompt?: () => string;
    cache?: boolean;
    ignoreBody?: boolean;
    __mockResponse__?: MockServer | IMockResponse;
};
declare type IMockResponse = (req: Class_HttpRequest) => void;
/**
 * @description fetch function, support fake
 * @param uri
 * @param opts_
 * @returns
 */
declare function regFetch(uri: string, opts_: IRegFetchOptions): INpmHttpResponse;
declare namespace regFetch {
    var mock: (uri: string, opts: IRegFetchOptions, __mockResponse__: MockServer | IMockResponse) => INpmHttpResponse;
    var json: (uri: string, opts: IRegFetchOptions) => any;
    var jsonMock: (uri: string, opts: IRegFetchOptions, __mockResponse__: MockServer | IMockResponse) => any;
    var errors: typeof import("./errors");
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
declare type IGetHeadersOptions = {
    headers?: Record<string, string>;
    userAgent?: IOptions['userAgent'];
    projectScope?: string;
    npmSession?: string;
    npmCommand?: string;
    otp?: string;
};
