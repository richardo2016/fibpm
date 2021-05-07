export type ILogHost = {
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  notice: (...args: any[]) => void
  info: (...args: any[]) => void
  verbose: (...args: any[]) => void
  silly: (...args: any[]) => void
  http: (...args: any[]) => void
  pause: (...args: any[]) => void
  resume: (...args: any[]) => void
};

const noop = Function.prototype

export const mockLog: ILogHost =  {
  error: console.error.bind(this),
  warn: console.warn.bind(this),
  notice: console.notice.bind(this),
  info: console.info.bind(this),
  verbose: console.debug.bind(this),
  silly: console.notice.bind(this, 'silly'),
  http: console.notice.bind(this, 'http'),
  pause: console.notice.bind(this, 'pause'),
  resume: console.notice.bind(this, 'resume'),
}

export function makeAuthMissingLog (uri: string, scopeAuthKey: string) {
  return `No auth for URI, but auth present for scoped registry.

URI: ${uri}
Scoped Registry Key: ${scopeAuthKey}

More info here: https://github.com/npm/cli/wiki/No-auth-for-URI,-but-auth-present-for-scoped-registry`
}

export const silentLog = {
  error: noop,
  warn: noop,
  notice: noop,
  info: noop,
  verbose: noop,
  silly: noop,
  http: noop,
  pause: noop,
  resume: noop,
} as ILogHost;

export default silentLog