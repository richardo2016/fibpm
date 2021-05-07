import io = require('io')
import http = require('http')

export class NpmHttpResponse extends http.Response {
    url: string;

    constructor (resp: Class_HttpResponse) {
        super();
        this.url = null;

        this.setHeader(resp.headers);
        io.copyStream(resp.body, this.body);
        this.statusCode = resp.statusCode;
        this.statusMessage = resp.statusMessage;
        this.value = resp.value;
    }
}

export function makeNpmHttpResponse (url: string, resp: Class_HttpResponse) {
    const nresp = new NpmHttpResponse(resp);
    nresp.url = url;

    return nresp;
}