export declare type ILogHost = {
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    notice: (...args: any[]) => void;
    info: (...args: any[]) => void;
    verbose: (...args: any[]) => void;
    silly: (...args: any[]) => void;
    http: (...args: any[]) => void;
    pause: (...args: any[]) => void;
    resume: (...args: any[]) => void;
};
export declare const mockLog: ILogHost;
declare const _default: ILogHost;
export default _default;
