/// <reference types="@fibjs/types" />
import http = require('http');
export declare class NpmHttpResponse extends http.Response {
    url: string;
    constructor(resp: Class_HttpResponse);
}
export declare function makeNpmHttpResponse(url: string, resp: Class_HttpResponse): NpmHttpResponse;
