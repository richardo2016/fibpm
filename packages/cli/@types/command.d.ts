/// <reference path="_common.d.ts" />
/// <reference path="option.d.ts" />

declare namespace FCliCommand {
    interface Argument {
        required: boolean
        name: string
        rest: boolean
    }

    // Demanded arguments in order [...allAngled, ...allSquared]
    type OrderedCommandArguments = FCliCommand.Argument[]

    interface Config {
        allowUnknownOptions?: boolean
        ignoreOptionDefaultValue?: boolean
    }

    type CommandExample = ((bin: string) => string) | string

    class Command {
        raw: string

        name: string
        description: string
        config: FCliCommand.Config
        cli: FCli.Cli
        
        options: FCliOption.Option[]
        aliasNames: string[]
        args: Argument[]
        examples: CommandExample[]

        commandAction?: (...args: any[]) => any
        usageText?: string
        versionNumber?: string
        helpCallback?: FCliCommon.HelpCallback
        topLevelCommand?: GlobalCommand

        readonly isDefaultCommand: boolean
        readonly isGlobalCommand: boolean

        option(raw: string, description: string, config?: FCliOption.OptionConfig): this

        /**
         * add alias of this command
         * @param name alias name
         */
        alias(name: string): this

        /**
         * set action for this command 
         * 
         * 
            interface ActionCallback {
                (
                    // Parsed CLI args
                    // The last arg will be an array if it's an varadic argument
                    ...args: string | string[] | number | number[],
                    // Parsed CLI options
                    options: FCliOption.Option[]
                ): void
            }
         * @param callback callback when this command executed
         */
        action(callback: Command['commandAction']): this

        /**
         * set usage text
         * 
         * @param text usage text
         */
        usage(text: string): this

        /**
         * set version number
         * 
         * @param version semver string
         * @param customFlags customzied flags, default as `-v, --version`
         */
        version(version: string, customFlags: string): this

        /**
         * Add command example
         * 
         * @param example Example Instance
         */
        example(example: FCliCommand.CommandExample): this

        hasOption(name: string): boolean
        isCommandMatched(name: string): boolean

        outputHelp(): void
        outputVersion(): void

        // internal check helpers :start
        checkUnknownOptions(): void
        checkOptionValue(): void
        checkRequiredArgs(): void
        // internal check helpers :end
    }

    type GlobalCommand = Command
}