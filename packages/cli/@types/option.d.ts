declare namespace FCliOption {
    interface OptionConfig {
        default?: any
        type?: any[]
    }
    
    class Option {
        raw: string
        name: string

        description: string
        /**
         * Option name and aliases
         * 
         * the normalized name(Option->name) must be 1st one.
         */
        names: string[]
        config: OptionConfig
        negative: boolean

        /**
         * `required` will be a boolean for options with brackets
         */
        readonly required?: boolean
        readonly isBoolean?: boolean
    }
}