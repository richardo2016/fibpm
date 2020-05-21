export const exit = (code: number) => {
  return process.exit(code)
}

export const DEFAULT_ARGS = process.argv.slice(0)
export const EOL = '\n'

export const PLATFORM_INFO = `${process.platform}-${process.arch} fibjs-${process.version}`