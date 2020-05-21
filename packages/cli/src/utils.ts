import Mri = require('mri')

// export function scan(argv: string | string[], opts: FCliCommon.ParserOptions) {
//     if (!Array.isArray(argv))
//         argv = [argv]

//     const [msg = null, loglevel = 'warn', abort = false] = checkOptions(opts) || []
//     if (msg) {
//         switch (loglevel) {
//             case 'error':
//                 console.error(msg)
//             case 'warn':
//                 console.warn(msg)
//             case 'log':
//             default:
//                 console.log(msg)
//         }

//         if (abort) return;
//     }

//     return Mri(argv, opts)
// }

// type LOGLEVEL = 'error' | 'warn' | 'log'
// function checkOptions(opts: FCliCommon.ParserOptions): undefined | [string, LOGLEVEL, boolean] {
//     if (!opts)
//         return

//     if (opts.hasOwnProperty('boolean')) {
//         if (typeof opts.boolean !== 'string' && (!Array.isArray(opts.boolean) || opts.boolean.some(x => typeof x !== 'string')))
//             return [`options.boolean is expected with type string | string[]`, 'warn', false]
//     }
// }

/**
 * @param v 
 */
export function removeBrackets(v: string) {
    return v.replace(/[<[].+/, '').trim()
}

const ANGLED_BRACKET_RE = /<([^>]+)>/g
const SQUARE_BRACKET_RE = /\[([^\]]+)\]/g
const VALID_VARNAME_PATTERN = '[$_a-zA-Z][$_a-zA-Z0-9]*'
/**
 * @sample VALID_VARNAME_RE.test('$$abc')
 * @sample VALID_VARNAME_RE.test('foo1')
 */
const VALID_VARNAME_RE = new RegExp(`^(${VALID_VARNAME_PATTERN})$`/* , 'g' */)
/**
 * @sample VALID_VARNAME_RE.test('...$$abc')
 * @sample VALID_VARNAME_RE.test('...foo1')
 */
const VALID_REST_VARNAME_RE = new RegExp(`^(\.\.\.${VALID_VARNAME_PATTERN})$`/* , 'g' */)
function getVarNameInfo (name: string) {
  let isRest = false,
      isNormal = VALID_VARNAME_RE.test(name),
      varName = name

  if (!isNormal) {
    isRest = VALID_REST_VARNAME_RE.test(name)
    if (isRest)
      varName = name.slice(3)
  } else 
    varName = name

  return { isValid: isRest || isNormal, isRest, varName }
}

function makeDemandedOption(name: string, required: boolean, rest: boolean): FCliCommand.Argument {
    return { required, name, rest }
}

export function parseBracketedArgs(v: string): FCliCommand.OrderedCommandArguments {
    const args = []

    let angled_tuple, square_tuple, info

    while ((angled_tuple = ANGLED_BRACKET_RE.exec(v))) {
      info = getVarNameInfo(angled_tuple[1])
      if (info.isValid)
        args.push(makeDemandedOption(info.varName, true && !info.isRest, info.isRest))
    }

    while ((square_tuple = SQUARE_BRACKET_RE.exec(v))) {
      info = getVarNameInfo(square_tuple[1])
      if (info.isValid)
        args.push(makeDemandedOption(info.varName, false, info.isRest))
    }

    return args
}

export function getMriOptions (options: FCliOption.Option[]): FCliArgv.RestrainedMriOptions {
  const result: FCliArgv.RestrainedMriOptions = { alias: {}, boolean: [] }

  for (const [index, option] of options.entries()) {
    // We do not set default values in mri options
    // Since its type (typeof) will be used to cast parsed arguments.
    // Which mean `--foo foo` will be parsed as `{foo: true}` if we have `{default:{foo: true}}`

    // Set alias
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1)
    }
    // Set boolean
    if (option.isBoolean) {
      if (option.negative) {
        // For negative option
        // We only set it to `boolean` type when there's no string-type option with the same name
        const hasStringTypeOption = options.some((o, i) => {
          return (
            i !== index &&
            typeof o.required === 'boolean' && 
            o.names.some(name => option.names.includes(name))
          )
        })

        if (!hasStringTypeOption)
          result.boolean.push(option.names[0])
      } else
        result.boolean.push(option.names[0])
    }
  }

  return result
}


export function findLongestStr (arr: string[]) {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1
  })[0]
}

export function padRight (str: string, length: number, fill: string = ' ') {
  // while (str.length < length)
  //   str += fill
  // return str
  return str.length >= length ? str : `${str}${' '.repeat(length - str.length)}`
}

export const camelCase = (input: string) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase()
  })
}

export function setDotProp (
  obj: { [k: string]: any },
  keys: string[],
  val: any
) {
  let i = 0
  let length = keys.length
  let t = obj
  let x
  for (; i < length; ++i) {
    x = t[keys[i]]
    t = t[keys[i]] =
      i === length - 1
        ? val
        : x != null
        ? x
        : !!~keys[i + 1].indexOf('.') || !(+keys[i + 1] > -1)
        ? {}
        : []
  }
}

export function setByType (
  obj: { [k: string]: any },
  transforms: { [k: string]: any }
) {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key]

    if (transform.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key])

      if (typeof transform.transformFunction === 'function') {
        obj[key] = obj[key].map(transform.transformFunction)
      }
    }
  }
}

export function getProgramAppFromFilepath (input: string) {
  const m = /([^\\\/]+)$/.exec(input)
  return m ? m[1] : ''
}

export function addUnWrittableProperty(obj: Fibjs.AnyObject, p: string, v: any) {
  Object.defineProperty(obj, p, {
    get value () { return v },
    configurable: false
  })
}

export function addVisibleUnWrittableProperty(obj: Fibjs.AnyObject, p: string, v: any) {
  Object.defineProperty(obj, p, {
    get value () { return v },
    enumerable: true,
    configurable: false
  })
}

export function addHiddenChangeableProperty(obj: Fibjs.AnyObject, p: string, v: any) {
  Object.defineProperty(obj, p, {
    get value () { return v },
    enumerable: false,
    configurable: true
  })
}