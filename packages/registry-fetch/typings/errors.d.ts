/// <reference types="@fibjs/types" />
declare type IErrorOpts = {
    url?: string;
    spec?: string;
};
declare type IBodyObject = object & {
    error?: string;
};
export declare class HttpErrorBase extends Error {
    name: string;
    headers: Record<string, string>;
    statusCode: number;
    code: string;
    method: string;
    uri: string;
    body: IBodyObject;
    pkgid: string;
    constructor(method: string, res: Class_HttpResponse, body: IBodyObject, opts: IErrorOpts);
}
export declare class HttpErrorGeneral extends HttpErrorBase {
    spec: string;
    constructor(method: string, res: Class_HttpResponse, body: IBodyObject, opts: IErrorOpts);
}
export declare class HttpErrorAuthOTP extends HttpErrorBase {
    constructor(method: string, res: Class_HttpResponse, body: IBodyObject, opts: IErrorOpts);
}
export declare class HttpErrorAuthIPAddress extends HttpErrorBase {
    constructor(method: string, res: Class_HttpResponse, body: IBodyObject, opts: IErrorOpts);
}
export declare class HttpErrorAuthUnknown extends HttpErrorBase {
    constructor(method: string, res: Class_HttpResponse, body: IBodyObject, opts: IErrorOpts);
}
export {};
