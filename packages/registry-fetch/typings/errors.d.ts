/// <reference types="@fibjs/types" />
import { INpmHttpResponse, ISpecInOptions } from './_types';
declare type IErrorOpts = {
    url?: string;
    spec?: ISpecInOptions;
};
declare type IBodyError = Class_Buffer & {
    error?: string;
};
export declare class HttpErrorBase extends Error {
    name: string;
    headers: Record<string, string>;
    statusCode: number;
    code: string;
    method: string;
    uri: string;
    body: Class_Buffer | IBodyError;
    pkgid: string;
    constructor(method: string, res: INpmHttpResponse, body: IBodyError, opts: IErrorOpts);
}
export declare class HttpErrorGeneral extends HttpErrorBase {
    spec: string;
    constructor(method: string, res: INpmHttpResponse, body: IBodyError, opts: IErrorOpts);
}
export declare class HttpErrorAuthOTP extends HttpErrorBase {
    constructor(method: string, res: INpmHttpResponse, body: IBodyError, opts: IErrorOpts);
}
export declare class HttpErrorAuthIPAddress extends HttpErrorBase {
    constructor(method: string, res: INpmHttpResponse, body: IBodyError, opts: IErrorOpts);
}
export declare class HttpErrorAuthUnknown extends HttpErrorBase {
    constructor(method: string, res: INpmHttpResponse, body: IBodyError, opts: IErrorOpts);
}
export {};
