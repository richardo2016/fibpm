import { IOptions } from './default-opts';
declare type IScopeKey = `@${string}`;
export declare type IGetAuthOpts = {
    log?: IOptions['log'];
    registry?: IOptions['registry'];
    forceAuth?: {
        username: string;
        _password?: string;
        password?: string;
        _authToken?: string;
        _auth?: string;
        auth?: string;
        otp?: string;
        'always-auth'?: boolean;
    };
} & Record<IScopeKey, string>;
declare const getAuth: (uri: string, opts?: IGetAuthOpts) => Auth;
declare type IRequiredTuple = [
    {
        token?: string;
    },
    {
        auth?: string;
    },
    {
        username?: string;
        password?: string;
    }
];
declare type IAuthConstructorOpts = {
    scopeAuthKey?: string;
} & IRequiredTuple[0] & IRequiredTuple[1] & IRequiredTuple[2];
/**
 * @description you should provide one of `IRequiredTuple`
 */
declare class Auth {
    scopeAuthKey: string;
    token?: string;
    auth?: string;
    isBasicAuth: boolean;
    constructor({ token, auth, username, password, scopeAuthKey }: IAuthConstructorOpts);
}
export default getAuth;
