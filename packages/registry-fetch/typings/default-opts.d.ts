import { ILogHost } from './slilent-log';
export declare type IOptions = {
    log: ILogHost;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    registry: string;
    timeout: number;
    strictSSL: boolean;
    noProxy: string | boolean;
    userAgent: string;
};
declare const _default: IOptions;
export default _default;
