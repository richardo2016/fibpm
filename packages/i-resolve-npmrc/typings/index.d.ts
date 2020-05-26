/**
 * @description find npmrc
 *
 * if projRoot provided and got one valid rc-config file path,
 * don't find rc-config file in USER HOME
 */
export declare function findConfigFile(projRoot?: string): string | false;
interface ParsedNpmrcInfo {
    filename?: string;
    config_existed: boolean;
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
