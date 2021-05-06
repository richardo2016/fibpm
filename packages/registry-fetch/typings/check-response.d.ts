/// <reference types="@fibjs/types" />
import { IOptions } from './default-opts';
import IGetAuth from './auth';
import { ISpecInOptions } from './_types';
declare type ICheckResponseOpts = Partial<IOptions> & {
    ignoreBody?: boolean;
    spec?: ISpecInOptions;
    url?: string;
};
declare type IResponseInfo = {
    method: IOptions['method'];
    uri: string;
    res: Class_HttpResponse;
    registry: string;
    startTime: number;
    auth: ReturnType<typeof IGetAuth>;
    opts: ICheckResponseOpts;
};
declare const checkResponse: ({ method, uri, res, registry, startTime, auth, opts }: IResponseInfo) => void | Class_HttpResponse;
export = checkResponse;
