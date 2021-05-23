/// <reference types="@fibjs/types" />
declare type IAlgorithm = 'md2' | 'md4' | 'md5' | 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512';
declare type ISsriInstInput = Partial<ISsriInst>;
declare type ISsriInst = {
    algorithms: IAlgorithm[];
    error: boolean;
    integrity: string;
    options: string[];
    pickAlgorithm: (...args: any[]) => IAlgorithm;
    sep: string;
    single: boolean;
    size?: number;
    strict: boolean;
};
declare type IParsedSubject = {
    toJSON(): string;
    toString(): string;
    hexDigest(): string;
    readonly isHash?: boolean;
    readonly isIntegrity?: boolean;
};
declare class Hash implements IParsedSubject {
    source: string;
    algorithm: ISsriInst['algorithms'][number];
    digest: string;
    options: string[];
    get isHash(): boolean;
    constructor(hash: string, opts: ISsriInstInput);
    hexDigest(): string;
    toJSON(): string;
    toString(opts?: ISsriInstInput): string;
}
declare class Integrity implements IParsedSubject {
    get isIntegrity(): boolean;
    toJSON(): string;
    toString(opts?: ISsriInstInput): string;
    concat(integrity: string | IntegrityLike, opts: ISsriInstInput): Hash | Integrity;
    hexDigest(): string;
    merge(integrity: IntegrityLike, opts: ISsriInstInput): void;
    match(integrity: IntegrityLike, opts?: ISsriInstInput): any;
    pickAlgorithm(opts?: ISsriInstInput): IAlgorithm;
}
declare type ParialFields<T, TF extends keyof T> = Omit<T, TF> & {
    [P in TF]?: T[P];
};
declare type IParseInput = IIntegrityString | ParialFields<HashLike, 'options'> | IntegrityLike;
export declare function parseSingle(sri: IParseInput, opts?: ISsriInstInput): Hash;
export declare function parseMultiple(sri: IParseInput, opts?: ISsriInstInput): Integrity;
export declare function parse(sri: IParseInput, opts?: ISsriInstInput): Hash | Integrity;
declare type IIntegrityString = string;
declare type HashLike = {
    algorithm: IAlgorithm;
    digest: string;
    options: string[];
};
declare type IntegrityLike = {
    [algo in IAlgorithm]?: HashLike;
};
export declare function stringify(obj: IntegrityLike, opts: ISsriInstInput): string;
export declare function fromHex(hexDigest: string | Class_Buffer, algorithm: IAlgorithm, opts: ISsriInstInput): Hash | Integrity;
export declare function fromData(data: string | Class_Buffer, opts: ISsriInstInput): Integrity;
export declare function checkData(data: Class_Buffer | string, _sri: IntegrityLike, opts: ISsriInstInput): boolean;
declare function createIntegrity(opts: ISsriInstInput): {
    update: (chunk: string, enc: string) => any;
    digest: (enc?: string) => Integrity;
};
export { createIntegrity as create };
