import crypto = require('crypto')

const figgyPudding = require('figgy-pudding')

type IErrCode = 'EBADSIZE' | 'EINTEGRITY'

type ISsriError<TC extends IErrCode> = Error & (TC extends 'EBADSIZE' ? {
    code: TC
    found: number
    expected: number
    sri: IntegrityLike
}
    : TC extends 'EINTEGRITY' ? {
        code: TC
        found: IntegrityLike
        expected: IntegrityLike
        algorithm: IAlgorithm
        sri: IntegrityLike
    } : never)

type IAlgorithm =
    'md2'
    | 'md4'
    | 'md5'
    | 'sha1'
    | 'sha224'
    | 'sha256'
    | 'sha384'
    | 'sha512'

type ISpecAlgorithm = 'sha256' | 'sha384' | 'sha512'
const SPEC_ALGORITHMS: ISpecAlgorithm[] = ['sha256', 'sha384', 'sha512']

const BASE64_REGEX = /^[a-z0-9+/]+(?:=?=?)$/i
const SRI_REGEX = /^([^-]+)-([^?]+)([?\S*]*)$/
const STRICT_SRI_REGEX = /^([^-]+)-([A-Za-z0-9+/=]{44,88})(\?[\x21-\x7E]*)?$/
const VCHAR_REGEX = /^[\x21-\x7E]+$/

type ISsriInstInput = Partial<ISsriInst>

type ISsriInst = {
    algorithms: IAlgorithm[],
    error: boolean,
    integrity: string
    options: string[]
    pickAlgorithm: (...args: any[]) => IAlgorithm,
    sep: string,
    single: boolean,
    size?: number,
    strict: boolean,
}
const SsriOpts = figgyPudding({
    algorithms: { default: ['sha512'] },
    error: { default: false },
    integrity: {},
    options: { default: [] },
    pickAlgorithm: { default: () => getPrioritizedHash },
    sep: { default: ' ' },
    single: { default: false },
    size: {},
    strict: { default: false }
})

const getOptString = (options: ISsriInst['options']) => !options || !options.length
    ? ''
    : `?${options.join('?')}`

type IParsedSubject = {
    toJSON(): string
    toString(): string
    hexDigest(): string
    readonly isHash?: boolean
    readonly isIntegrity?: boolean
}
class Hash implements IParsedSubject {
    source: string;
    algorithm: ISsriInst['algorithms'][number]
    digest: string
    options: string[]

    get isHash() { return true }
    constructor(hash: string, opts: ISsriInstInput) {
        opts = SsriOpts(opts)
        const strict = !!opts.strict
        this.source = hash.trim()

        // set default values so that we make V8 happy to
        // always see a familiar object template.
        this.digest = ''
        this.algorithm = '' as any
        this.options = []

        // 3.1. Integrity metadata (called "Hash" by ssri)
        // https://w3c.github.io/webappsec-subresource-integrity/#integrity-metadata-description
        const match = this.source.match(
            strict
                ? STRICT_SRI_REGEX
                : SRI_REGEX
        ) as null | [
            xxx: string,
            algo: IAlgorithm,
            base64_digets: string,
            rstring: string
        ]

        if (!match) { return }
        if (strict && !SPEC_ALGORITHMS.some(a => a === match[1])) { return }
        this.algorithm = match[1] as any
        this.digest = match[2]

        const rawOpts = match[3]
        if (rawOpts) {
            this.options = rawOpts.slice(1).split('?')
        }
    }
    hexDigest(): string {
        return this.digest && Buffer.from(this.digest, 'base64').toString('hex')
    }
    toJSON() {
        return this.toString()
    }
    toString(opts?: ISsriInstInput) {
        opts = SsriOpts(opts)
        if (opts.strict) {
            // Strict mode enforces the standard as close to the foot of the
            // letter as it can.
            if (!(
                // The spec has very restricted productions for algorithms.
                // https://www.w3.org/TR/CSP2/#source-list-syntax
                SPEC_ALGORITHMS.some(x => x === this.algorithm) &&
                // Usually, if someone insists on using a "different" base64, we
                // leave it as-is, since there's multiple standards, and the
                // specified is not a URL-safe variant.
                // https://www.w3.org/TR/CSP2/#base64_value
                this.digest.match(BASE64_REGEX) &&
                // Option syntax is strictly visual chars.
                // https://w3c.github.io/webappsec-subresource-integrity/#grammardef-option-expression
                // https://tools.ietf.org/html/rfc5234#appendix-B.1
                (this.options || []).every(opt => opt.match(VCHAR_REGEX))
            )) {
                return ''
            }
        }
        const options = this.options && this.options.length
            ? `?${this.options.join('?')}`
            : ''
        return `${this.algorithm}-${this.digest}${options}`
    }
}

class Integrity implements IParsedSubject {
    get isIntegrity() { return true }
    toJSON() {
        return this.toString()
    }
    toString(opts?: ISsriInstInput) {
        opts = SsriOpts(opts)
        let sep = opts.sep || ' '
        if (opts.strict) {
            // Entries must be separated by whitespace, according to spec.
            sep = sep.replace(/\S+/g, ' ')
        }
        return Object.entries(this).map(([k, v]) => {
            return v.map((hash: string) => {
                return Hash.prototype.toString.call(hash, opts) as string
            }).filter((x: string) => x.length).join(sep)
        }).filter(x => x.length).join(sep)
    }
    concat(integrity: string | IntegrityLike, opts: ISsriInstInput) {
        opts = SsriOpts(opts)
        const other = typeof integrity === 'string'
            ? integrity
            : stringify(integrity, opts)
        return parse(`${this.toString(opts)} ${other}`, opts)
    }
    hexDigest(): string {
        return parseSingle(this as IntegrityLike).hexDigest()
    }

    // add additional hashes to an integrity value, but prevent
    // *changing* an existing integrity hash.
    merge(integrity: IntegrityLike, opts: ISsriInstInput) {
        opts = SsriOpts(opts)
        const other = parse(integrity, opts) as Integrity
        const _this: any = this
        const _other: any = other

        for (const algo in other) {
            if (_this[algo]) {
                if (!_this[algo].find((hash: HashLike) =>
                    _other[algo].find((otherhash: HashLike) =>
                        hash.digest === otherhash.digest))) {
                    throw new Error('hashes do not match, cannot update integrity')
                }
            } else {
                _this[algo] = _other[algo]
            }
        }
    }
    match(integrity: IntegrityLike, opts?: ISsriInstInput) {
        opts = SsriOpts(opts)
        const other = parse(integrity, opts) as Integrity
        const algo = other.pickAlgorithm(opts)

        const _this: any = this
        const _other: any = other

        return (
            _this[algo] &&
            _other[algo] &&
            _this[algo].find((hash: HashLike) =>
                _other[algo].find((otherhash: HashLike) =>
                    hash.digest === otherhash.digest
                )
            )
        ) || false
    }
    pickAlgorithm(opts?: ISsriInstInput): IAlgorithm {
        opts = SsriOpts(opts)
        const pickAlgorithm = opts.pickAlgorithm
        const keys = Object.keys(this) as IAlgorithm[]
        if (!keys.length) {
            throw new Error(`No algorithms available for ${JSON.stringify(this.toString())}`)
        }
        return keys.reduce((acc, algo) => {
            return pickAlgorithm(acc, algo) || acc
        })
    }
}

type ParialFields<T, TF extends keyof T> = Omit<T, TF> & { [P in TF]?: T[P] }

type IParseInput = IIntegrityString | ParialFields<HashLike, 'options'> | IntegrityLike

function isHashLike(sri: IParseInput): sri is HashLike | Hash {
    if (typeof sri === 'string') return false;

    return 'algorithm' in sri && 'digest' in sri
}

function toIntegrity (sri: IParseInput, opts?: ISsriInstInput) {
    if (typeof sri === 'string') {
        return sri;
    } 
    
    if (isHashLike(sri)) {
        const fullSri = new Integrity()
        // @ts-ignore
        fullSri[sri.algorithm] = [sri]

        return stringify(fullSri as IntegrityLike, opts); 
    }

    return stringify(sri as IntegrityLike, opts); 
}

export function parseSingle(
    sri: IParseInput,
    opts?: ISsriInstInput
): Hash {
    opts = SsriOpts(opts)

    // 3.4.3. Parse metadata
    // https://w3c.github.io/webappsec-subresource-integrity/#parse-metadata
    return new Hash(toIntegrity(sri, opts), opts)
}

export function parseMultiple(
    sri: IParseInput,
    opts?: ISsriInstInput
): Integrity {
    opts = SsriOpts(opts)
    opts.single = false;

    return parse(sri, opts) as Integrity;
}

export function parse(sri: IParseInput, opts?: ISsriInstInput) {
    opts = SsriOpts(opts)
    if (opts.single) {
        return parseSingle(sri, opts) as Hash
    }

    const integrity = toIntegrity(sri, opts);

    return integrity.trim().split(/\s+/).reduce((acc, string) => {
        const hash = new Hash(string, opts)
        if (hash.algorithm && hash.digest) {
            const algo = hash.algorithm
            if (!(acc as any)[algo]) { (acc as any)[algo] = [] }
            (acc as any)[algo].push(hash)
        }
        return acc
    }, new Integrity())
}

type IIntegrityString = string
type HashLike = {
    algorithm: IAlgorithm,
    digest: string,
    options: string[]
}
type IntegrityLike = {
    [algo in IAlgorithm]?: HashLike
}

export function stringify(obj: IntegrityLike, opts: ISsriInstInput): string {
    opts = SsriOpts(opts)

    if (typeof obj === 'string') {
        return stringify(parse(obj, opts) as IntegrityLike, opts)
    } else if ('algorithm' in obj && 'digest' in obj) {
        return Hash.prototype.toString.call(obj, opts)
    } else {
        return Integrity.prototype.toString.call(obj, opts)
    }
}

export function fromHex(hexDigest: string | Class_Buffer, algorithm: IAlgorithm, opts: ISsriInstInput) {
    opts = SsriOpts(opts)
    const optString = opts.options && opts.options.length
        ? `?${opts.options.join('?')}`
        : ''
    return parse(
        `${algorithm}-${Buffer.from(hexDigest + '', 'hex').toString('base64')
        }${optString}`, opts
    )
}

export function fromData(data: string | Class_Buffer, opts: ISsriInstInput): Integrity {
    opts = SsriOpts(opts)
    const algorithms = opts.algorithms
    const optString = opts.options && opts.options.length
        ? `?${opts.options.join('?')}`
        : ''
    return algorithms.reduce((acc: Integrity, algo: IAlgorithm) => {
        const digest = crypto.createHash(algo).update(data as Class_Buffer).digest('base64')
        const hash = new Hash(
            `${algo}-${digest}${optString}`,
            opts
        )
        if (hash.algorithm && hash.digest) {
            const algo = hash.algorithm
            if (!(acc as any)[algo]) { (acc as any)[algo] = [] }
            (acc as any)[algo].push(hash)
        }
        return acc
    }, new Integrity())
}

export function checkData(data: Class_Buffer | string, _sri: IntegrityLike, opts: ISsriInstInput): boolean {
    opts = SsriOpts(opts)
    const sri = parse(_sri, opts) as Integrity
    if (!Object.keys(sri).length) {
        if (opts.error) {
            throw Object.assign(
                new Error('No valid integrity hashes to check against'), {
                code: 'EINTEGRITY'
            })
        } else {
            return false
        }
    }
    const algorithm = sri.pickAlgorithm(opts)
    const digest = crypto.createHash(algorithm).update(data as Class_Buffer).digest('base64')
    const newSri = parse({ algorithm, digest }) as Integrity
    const match = newSri.match(sri as IntegrityLike, opts)
    if (match || !opts.error) {
        return match
    } else if (typeof opts.size === 'number' && (data.length !== opts.size)) {
        const err = new Error(`data size mismatch when checking ${sri}.\n  Wanted: ${opts.size}\n  Found: ${data.length}`) as ISsriError<'EBADSIZE'>
        err.code = 'EBADSIZE'
        err.found = data.length
        err.expected = opts.size
        err.sri = sri as IntegrityLike
        throw err
    } else {
        const err = new Error(`Integrity checksum failed when using ${algorithm}: Wanted ${sri}, but got ${newSri}. (${data.length} bytes)`) as ISsriError<'EINTEGRITY'>
        err.code = 'EINTEGRITY'
        err.found = newSri as IntegrityLike
        err.expected = sri as IntegrityLike
        err.algorithm = algorithm
        err.sri = sri as IntegrityLike
        throw err
    }
}

function createIntegrity(opts: ISsriInstInput) {
    opts = SsriOpts(opts)
    const algorithms = opts.algorithms
    const optString = getOptString(opts.options)

    // console.warn('optString', optString);

    const hashes = algorithms.map((algo) => crypto.createHash(algo))

    return {
        update: function (chunk: string, enc: string) {
            hashes.forEach(h => h.update(Buffer.from(chunk, enc)))
            return this
        },
        digest: function (enc?: string) {
            const integrity = algorithms.reduce((acc, algo) => {
                const digest = hashes.shift().digest('base64')
                const hash = new Hash(
                    `${algo}-${digest}${optString}`,
                    opts
                )
                /* istanbul ignore else - it would be VERY strange if the hash we
                 * just calculated with an algo did not have an algo or digest.
                 */
                if (hash.algorithm && hash.digest) {
                    const algo = hash.algorithm
                    const _acc: any = acc;
                    if (!_acc[algo]) { _acc[algo] = [] }
                    _acc[algo].push(hash)
                }
                return acc
            }, new Integrity())

            return integrity
        }
    }
}

export { createIntegrity as create };

const FIBJS_HASHES = new Set<string>('getHashes' in crypto ? (crypto as any).getHashes() : [
    'md5',
    'sha1',
    'sha224',
    'sha256',
    'sha384',
    'sha512',
])

// This is a Best Effort™ at a reasonable priority for hash algos
const DEFAULT_PRIORITY = [
    'md5', 'whirlpool', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
    // TODO - it's unclear _which_ of these Node will actually use as its name
    //        for the algorithm, so we guesswork it based on the OpenSSL names.
    'sha3',
    'sha3-256', 'sha3-384', 'sha3-512',
    'sha3_256', 'sha3_384', 'sha3_512'
].filter(algo => FIBJS_HASHES.has(algo))

function getPrioritizedHash(algo1: string, algo2: string): string {
    return DEFAULT_PRIORITY.indexOf(algo1.toLowerCase()) >= DEFAULT_PRIORITY.indexOf(algo2.toLowerCase())
        ? algo1
        : algo2
}