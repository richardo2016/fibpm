import fetch = require('@fibpm/registry-fetch');
declare type IRegFetchOptions = Parameters<typeof fetch>[1];
export declare const adduserCouch: (username: string, email: string, password: string, opts?: IRegFetchOptions) => any;
export declare const loginCouch: (username: string, password: string, opts?: IRegFetchOptions) => Record<string, any>;
export declare const get: (opts?: IRegFetchOptions) => any;
export declare const set: (profile: Record<string, string>, opts?: IRegFetchOptions) => any;
export {};
