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

export default {
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