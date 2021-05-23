declare type ICBO = {
    done(): void;
};
export declare const test: (test_desc: string, fn: (cbo?: ICBO) => void) => void;
export {};
