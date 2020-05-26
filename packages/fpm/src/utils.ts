import uuid = require('uuid')

export function getUuid(uuid_version: 'v1' | 'v4' = 'v4') {
    // which is uuid v1
    // return uuid.node().hex().toString()
    let str
    switch (uuid_version) {
        case 'v1':
            str = uuid.node().hex().toString()
            break
        default:
        case 'v4':
            str = uuid.random().hex().toString()
            break
    }

    return [
        str.slice(0, 8),
        str.slice(8, 12),
        str.slice(12, 16),
        str.slice(16, 20),
        str.slice(20),
    ].join('-')
}

export function getISODateString (date = new Date()) {
    return date.toISOString()
}

export function isNpmCi () {
    return `${process.env.FPM_IN_CI ? true : false}`
}