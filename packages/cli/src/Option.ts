import * as Utils from './utils'

export = class FCliOption implements FCliOption.Option {
    name: string
    names: string[]
    config: FCliOption.OptionConfig
    negative: boolean

    readonly required?: boolean
    readonly isBoolean?: boolean

    constructor(
        public raw: string,
        public description: string,
        config?: FCliOption.OptionConfig
    ) {
        this.config = Object.assign({}, config)

        // You may use cli.option('--env.* [value]', 'desc') to denote a dot-nested option
        raw = raw.replace(/\.\*/g, '')

        this.negative = false
        this.names = Utils.removeBrackets(raw)
            .split(',')
            .map((v: string) => {
                let name = v.trim().replace(/^-{1,2}/, '')
                if (name.startsWith('no-')) {
                    this.negative = true
                    name = name.replace(/^no-/, '')
                }
                return name
            })
            .sort((a, b) => (a.length > b.length ? 1 : -1)) // Sort names

        // Use the latest name as actual option name
        this.name = this.names[this.names.length - 1]

        if (this.negative)
            this.config.default = true

        if (raw.includes('<'))
            Utils.addVisibleUnWrittableProperty(this, 'required', true)
        else if (raw.includes('['))
            Utils.addVisibleUnWrittableProperty(this, 'required', false)
        else
            // No arg needed, it's boolean flag
            Utils.addVisibleUnWrittableProperty(this, 'isBoolean', true)
    }
}