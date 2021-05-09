import fetch = require('@fibpm/registry-fetch');
declare type IRegFetchOptions = Parameters<typeof fetch>[1] & {
    creds?: {
        username: string;
        password: string;
        email: string;
    };
};
declare type IPrompter = (creds: IRegFetchOptions['creds']) => IRegFetchOptions['creds'];
export declare const login: (opener: string, prompter: IPrompter, opts?: IRegFetchOptions) => any;
export declare const adduser: (opener: IOpener, prompter: IPrompter, opts?: IRegFetchOptions) => any;
export declare const adduserWeb: (opener: IOpener, opts?: IRegFetchOptions) => any;
export declare const loginWeb: (opener: any, opts?: IRegFetchOptions) => any;
declare type IOpener = any;
export declare const adduserCouch: (username: string, email: string, password: string, opts?: IRegFetchOptions) => any;
export declare const loginCouch: (username: string, password: string, opts?: IRegFetchOptions) => Record<string, any>;
export declare const get: (opts?: IRegFetchOptions) => any;
export declare const set: (profile: Record<string, string>, opts?: IRegFetchOptions) => any;
export declare const listTokens: (opts?: IRegFetchOptions) => object[];
export declare const removeToken: (tokenKey: string, opts?: IRegFetchOptions) => null;
export declare const createToken: (password: string, readonly?: boolean, cidrs?: object[], opts?: {}) => any;
export {};
