declare namespace FCliCommon {
    interface HelpSection {
        title?: string
        body: string
    }

    type HelpCallback = (sections: HelpSection[]) => void
    /**
     * which is inherited from `minimist`
     */
    interface ParserOptions {
        string?: string | string[]
        boolean?: boolean | string | string[]
        /**
         * @example
         * 
         * {
         *  "alias1": "argument1",
         *  "alias2": "argument2",
         * }
         * 
         * or
         * 
         * ["argument1", "argument2"]
         */
        alias?: { [a: string]: string } | string[]

        /**
         * @example
         * 
         * {
         *  "arg1": [defaultValue],
         *  "arg2": [defaultValue],
         * }
         */
        default?: { [arg: string]: any }

        unknown?: {
            (k: string): boolean
        }

        '--': boolean
    }
}