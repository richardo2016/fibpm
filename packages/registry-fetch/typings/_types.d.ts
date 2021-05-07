/// <reference types="@fibjs/types" />
export declare type ISpecInOptions = string | ReturnType<typeof import('npm-package-arg')>;
export declare type INpmHttpResponse = Class_HttpResponse & {
    url: string;
};
