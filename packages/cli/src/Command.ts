import Option = require('./Option');
import * as Utils from './utils'
import { exit } from 'process';
import { PLATFORM_INFO, EOL } from './ctrl';

export class FCliCommand implements FCliCommand.Command {
    options: FCliOption.Option[]
    aliasNames: string[]
    /* Parsed command name */
    name: string
    args: FCliCommand.Argument[]
    examples: FCliCommand.CommandExample[]
    helpCallback?: FCliCommon.HelpCallback
    topLevelCommand?: FCliCommand.GlobalCommand

    commandAction?: (...args: any[]) => any
    usageText?: string
    versionNumber?: string

    constructor(
        public raw: string,
        public description: string,
        public config: FCliCommand.Config = {},
        public cli: FCli.Cli
    ) {
        this.options = []
        this.aliasNames = []
        this.name = Utils.removeBrackets(raw)
        this.args = Utils.parseBracketedArgs(raw)
        this.examples = []
    }

    usage(text: string) {
        this.usageText = text
        return this
    }

    version(version: string, customFlags = '-v, --version') {
        this.versionNumber = version
        this.option(customFlags, 'Display version number')
        return this
    }

    example(example: FCliCommand.CommandExample) {
        this.examples.push(example)
        return this
    }

    /**
     * Add a option for this command
     * @param raw Raw option name(s)
     * @param description Option description
     * @param config Option config
     */
    option(raw: string, description: string, config?: FCliOption.OptionConfig) {
        this.options.push(
            new Option(raw, description, config)
        )

        return this
    }

    alias(name: string) {
        this.aliasNames.push(name)
        return this
    }

    action(callback: (...args: any[]) => any) {
        Utils.addHiddenChangeableProperty(this, 'commandAction', callback)
        return this
    }

    /**
     * Check if a command name is matched by this command
     * @param name Command name
     */
    isCommandMatched(name: string) {
        return this.name === name || this.aliasNames.includes(name)
    }

    get isDefaultCommand() {
        return this.name === '' || this.aliasNames.includes('!')
    }

    get isGlobalCommand() {
        return this instanceof FCliGlobalCommand
    }

    /**
     * Check if an option is registered in this command
     * @param name Option name
     */
    hasOption(name: string) {
        name = name.split('.')[0]

        return !!this.options.find(option => option.names.includes(name))
    }

    outputHelp() {
        const { name, commands } = this.cli
        const {
            versionNumber,
            options: globalOptions,
            helpCallback
        } = this.cli.topLevelCommand

        const sections: FCliCommon.HelpSection[] = [
            {
                body: `${name}${versionNumber ? ` v${versionNumber}` : ''}`
            }
        ]

        sections.push({
            title: 'Usage',
            body: `  $ ${name} ${this.usageText || this.raw}`
        })

        const showCommands =
            (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0

        if (showCommands) {
            const longestCommandName = Utils.findLongestStr(commands.map(command => command.raw))

            sections.push({
                title: 'Commands',
                body: commands
                    .map(command => {
                        return `  ${Utils.padRight(
                            command.raw,
                            longestCommandName.length
                        )}  ${command.description}`
                    })
                    .join(EOL)
            })
            sections.push({
                title: `For more info, run any command with the \`--help\` flag`,
                body: commands
                    .map(
                        command =>
                            `  $ ${name}${
                            command.name === '' ? '' : ` ${command.name}`
                            } --help`
                    )
                    .join(EOL)
            })
        }

        const options = this.isGlobalCommand
            ? globalOptions
            : [...this.options, ...(globalOptions || [])]
        if (options.length > 0) {
            const longestOptionName = Utils.findLongestStr(
                options.map(option => option.raw)
            )
            sections.push({
                title: 'Options',
                body: options
                    .map(option => {
                        return `  ${Utils.padRight(option.raw, longestOptionName.length)}  ${
                            option.description
                            } ${
                            option.config.default === undefined
                                ? ''
                                : `(default: ${option.config.default})`
                            }`
                    })
                    .join(EOL)
            })
        }

        if (this.examples.length > 0) {
            sections.push({
                title: 'Examples',
                body: this.examples
                    .map(example => {
                        if (typeof example === 'function') {
                            return example(name)
                        }
                        return example
                    })
                    .join(EOL)
            })
        }

        if (helpCallback) {
            helpCallback(sections)
        }

        console.log(
            sections
                .map(section => {
                    return section.title
                        ? `${section.title}:${EOL}${section.body}`
                        : section.body
                })
                .join(`${EOL}${EOL}`)
        )

        exit(0)
    }

    outputVersion() {
        const { name } = this.cli
        const { versionNumber } = this.cli.topLevelCommand
        if (versionNumber) {
            console.log(`${name}/${versionNumber} ${PLATFORM_INFO}`)
        }
        exit(0)
    }

    checkRequiredArgs() {
        const minimalArgsCount = this.args.filter(arg => arg.required).length

        if (this.cli.args.length < minimalArgsCount) {
            console.error(
                `error: missing required args for command \`${this.raw}\``
            )
            exit(1)
        }
    }

    /**
     * Check if the parsed options contain any unknown options
     *
     * Exit and output error when true
     */
    checkUnknownOptions() {
        const { rawOptions, topLevelCommand } = this.cli
        if (!this.config.allowUnknownOptions) {
            for (const name of Object.keys(rawOptions)) {
                if (
                    name !== '--' &&
                    !this.hasOption(name) &&
                    !topLevelCommand.hasOption(name)
                ) {
                    console.error(
                        `error: Unknown option \`${
                        name.length > 1 ? `--${name}` : `-${name}`
                        }\``
                    )
                    exit(1)
                }
            }
        }
    }

    /**
     * Check if the required string-type options exist
     */
    checkOptionValue() {
        const { rawOptions, topLevelCommand } = this.cli
        const options = [...topLevelCommand.options, ...this.options]
        for (const option of options) {
            const value = rawOptions[option.name.split('.')[0]]
            // Check required option value
            if (option.required) {
                const hasNegated = options.some(
                    o => o.negative && o.names.includes(option.name)
                )
                if (value === true || (value === false && !hasNegated)) {
                    console.error(`error: option \`${option.raw}\` value is missing`)
                    exit(1)
                }
            }
        }
    }
}

export class FCliGlobalCommand extends FCliCommand {
  constructor(cli: FCli.Cli) {
    super('@@global@@', '', {}, cli)
  }
}
