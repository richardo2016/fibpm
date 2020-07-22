import { findConfigFile, parseNpmrc } from '@fibpm/i-resolve-npmrc'

export function findAndParseNpmrc (): ReturnType<typeof parseNpmrc> {
    return parseNpmrc(findConfigFile(process.cwd()) || undefined)
}

import Commander from './Commander'

export { Commander }

const cmder = new Commander()

export default cmder