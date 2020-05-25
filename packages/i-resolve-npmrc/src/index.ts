import fs = require('fs')
import path = require('path')
import url = require('url')
import querystring = require('querystring')
import util = require('util')

const DFLT_RC_FILENAME = '.npmrc'
const CWD = process.cwd()
/**
 * @description find npmrc
 */
export function findConfigFile(projRoot?: string): string | false {
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

    if (fs.exists(projRc) && fs.stat(projRc).isFile())
        return projRc

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
    // [k: string]: any
}

const KV_TUPLE_LINE = /^([^=]+)=([^=]*)$/

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
    let rcLines = []

    if (configPath) {
        try {
            rcLines = fs.readLines(configPath)
            rcConfig.filename = configPath
            rcConfig.config_existed = true
        } catch (error) {}
    }

    rcLines.forEach((rcLine, lineNo) => {
        // empty line
        if (!rcLine.trim()) return ;
        // comment line
        if (rcLine.startsWith('#')) return ;

        // parse //<hostname>/
        if (rcLine.startsWith('//')) {
            rcConfig.auths.push(parseAuthUrl(rcLine))
        } else if (KV_TUPLE_LINE.test(rcLine)) {
            util.extend(rcConfig.npm_configs, tryParseKvs(rcLine))
        } else {
            throw new Error(`unexpected line '${rcLine}' in rc config file ${configPath}:L${lineNo}`)
        }
    })

    return rcConfig
};

function tryParseKvs (input: string) {
    let kvs = <Record<string, string>>{}
    try {
        kvs = querystring.parse(input).toJSON()
    } catch (error) {}

    return kvs
}

function parseAuthUrl (rcLine: string): ParsedNpmrcInfo['auths'][any] {
    const urlinfo = url.parse(rcLine, false, true)
    const kvstring = urlinfo.pathname.replace(/^\//, '')
    const kvs = tryParseKvs(kvstring)

    return {
        protocol: urlinfo.protocol,
        hostname: urlinfo.hostname,
        type: 'authToken',
        authToken: kvs[':_authToken']
    }
}