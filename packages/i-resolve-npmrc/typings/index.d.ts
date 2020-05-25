/**
 * @description find npmrc
 */
export declare function findConfigFile(projRoot?: string): string | false;
interface ParsedNpmrcInfo {
    auths: ({
        protocol?: string;
        hostname: string;
        type: 'authToken';
        authToken: string;
    })[];
    npm_configs: {
        [k: string]: string;
    };
}
/**
 * @description parse found rc config file
 *
 * @param configPath rc config filepath
 */
export declare function parseNpmrc(configPath: string): ParsedNpmrcInfo;
export {};
