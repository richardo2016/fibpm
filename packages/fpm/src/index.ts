import { findConfigFile, parseNpmrc } from '@coli/i-resolve-npmrc'

export function findAndParseNpmrc (): ReturnType<typeof parseNpmrc> {
    return parseNpmrc(findConfigFile(process.cwd()) || undefined)
}

import Commander from './Commander'

export { Commander }

const fpm = new Commander()

export default fpm