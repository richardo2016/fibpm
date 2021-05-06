import fs = require('fs')
import path = require('path')
import url = require('url')
import querystring = require('querystring')
import ini = require('ini')

const DFLT_RC_FILENAME = '.npmrc'
const CWD = process.cwd()

const isUnixTermWin32 = process.platform === 'win32' && (
    !!process.env.TERM || !!process.env.COLORTERM
)

/**
 * @description find npmrc
 * 
 * if projRoot provided and got one valid rc-config file path,
 * don't find rc-config file in USER HOME
 */
export function findConfigFile(projRoot?: string): string | false {
    const providedInput = !!projRoot
    projRoot = path.isAbsolute(projRoot) ? projRoot : path.join(CWD, projRoot)
    
    let projRc
    if (projRoot && fs.exists(projRoot)) {
        const stat = fs.stat(projRoot)
         if (stat.isDirectory()) {
            projRc = path.resolve(projRoot, `./${DFLT_RC_FILENAME}`)
         } else if (stat.isFile()) {
            projRc = projRoot
         }
    }

    if (projRc && fs.exists(projRc)) {
        if (fs.stat(projRc).isFile()) return projRc
    } else if (!projRc || providedInput)
        return false;

    const homeRc = path.resolve(process.env.HOME, `./${DFLT_RC_FILENAME}`)
    
    if (fs.exists(homeRc) && fs.stat(homeRc).isFile())
        return homeRc

    return false
}

interface ParsedNpmrcInfo {
    filename?: string
    config_existed: boolean
    auths: ({
        protocol?: string
        hostname: string
        type: 'authToken'
        authToken: string
    })[]
    npm_configs: {
        [k: string]: string
    }
}

export function parseInI (input: string) {
    return ini.parse(input);
} 

/**
 * @description parse found rc config file
 * 
 * @param configPath rc config filepath
 */
export function parseNpmrc (
    configPath: string
): ParsedNpmrcInfo {
    const rcConfig = <ParsedNpmrcInfo>{
        config_existed: false,
        auths: [],
        npm_configs: {}
    }

    if (!fs.exists(configPath)) {
        return rcConfig;
    }

    rcConfig.filename = configPath;
    rcConfig.config_existed = true;

    const fileContent = fs.readTextFile(configPath);

    const parsed = ini.parse(fileContent);

    Object.keys(parsed).forEach((key) => {
        const value = parsed[key];

        if (key.startsWith('//')) {
            rcConfig.auths.push(parseAuthUrl(`${key}=${value}`))
        } else {
            rcConfig.npm_configs[key] = value;
        }
    });

    return rcConfig
};

function tryParseKvs (input: string) {
    let kvs = <Record<string, string>>{}
    try {
        kvs = querystring.parse(input).toJSON()
    } catch (error) {}

    return kvs
}

function parseAuthUrl (rcKvLine: string): ParsedNpmrcInfo['auths'][any] {
    const urlinfo = url.parse(rcKvLine, false, true)
    const kvstring = urlinfo.pathname.replace(/^\//, '')
    const kvs = tryParseKvs(kvstring)

    return {
        protocol: urlinfo.protocol,
        hostname: urlinfo.hostname,
        type: 'authToken',
        authToken: kvs[':_authToken']
    }
}