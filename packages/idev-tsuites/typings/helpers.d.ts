export declare function shouldFail(runner: Function): (func: (err: Error) => any) => any;
export declare function assertLike(obj1: object, obj2: object): void;
export declare function assertMatch(input: string, regexp: RegExp): void;
export declare function runAndReturnError(fnt: Function): any;
export declare function assertThrowError(fnt: Function, regExp: string | RegExp): void;
export declare function doesNotThrow(fnt: Function): void;
