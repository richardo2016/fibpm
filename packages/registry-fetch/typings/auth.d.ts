import { IOptions } from './default-opts';
declare type IKvs = Record<string, string>;
export declare type IGetAuthOpts = IKvs & {
    log?: IOptions['log'];
    forceAuth?: IKvs;
};
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
