import { IOptions } from './default-opts';
import IGetAuth from './auth';
import { INpmHttpResponse, ISpecInOptions } from './_types';
declare type ICheckResponseOpts = Partial<IOptions> & {
    ignoreBody?: boolean;
    spec?: ISpecInOptions;
    url?: string;
};
declare type IResponseInfo = {
    method: IOptions['method'];
    uri: string;
    res: INpmHttpResponse;
    registry: string;
    startTime: number;
    auth: ReturnType<typeof IGetAuth>;
    opts: ICheckResponseOpts;
};
declare const checkResponse: ({ method, uri, res, registry, startTime, auth, opts }: IResponseInfo) => void | INpmHttpResponse;
export = checkResponse;
