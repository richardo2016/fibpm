const pkg = require('../package.json')
import { silentLog, ILogHost } from './silentlog';

export type IOptions = {
    log: ILogHost,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    registry: string
    timeout: number
    strictSSL: boolean
    noProxy: string | boolean
    userAgent: string
}

export default {
    log: silentLog,
    method: 'GET',
    registry: 'https://registry.npmjs.org/',
    timeout: 5 * 60 * 1000, // 5 minutes
    strictSSL: true,
    noProxy: process.env.NOPROXY,
    userAgent: `${pkg.name
        }@${pkg.version
        }/fibjs@${process.version
        }+${process.arch
        } (${process.platform
        })`,
} as IOptions