import Mri = require('mri')
import * as Utils from './utils'
import { EventEmitter } from 'events';
import { FCliGlobalCommand, FCliCommand } from './Command';
import { DEFAULT_ARGS } from './ctrl';

function showHelpOnExit (cli: FCli.Cli): boolean {
  return cli.topLevelCommand.hasOwnProperty('helpCallback')
}

function showVersionOnExit (cli: FCli.Cli): boolean {
  return !!cli.topLevelCommand.versionNumber
}

function setParsedInfo(
  this: FCli.Cli,
  { args, options, rawOptions }: FCliArgv.MriResult,
  matchedCommand?: FCliCommand.Command,
  matchedCommandName?: string
) {
  this.args = args
  this.options = options
  this.rawOptions = rawOptions

  if (matchedCommand)
    this.matchedCommand = matchedCommand

  if (matchedCommandName)
    this.matchedCommandName = matchedCommandName

  return this
}

function setupTopLevelCmd (this: FCli.Cli) {
    this.topLevelCommand = new FCliGlobalCommand(this)
    this.topLevelCommand.usage('<command> [options]')
}



function runMatchedCommand(cli: FCli.Cli) {
    const { args, options, matchedCommand: mcommand } = cli

    if (!mcommand || !mcommand.commandAction) return

    mcommand.checkUnknownOptions()
    mcommand.checkOptionValue()
    mcommand.checkRequiredArgs()

    const actionArgs: any[] = []

    mcommand.args.forEach((arg, index) => {
        if (arg.rest) {
            actionArgs.push(args.slice(index))
        } else {
            actionArgs.push(args[index])
        }
    })

    actionArgs.push(options)
    return mcommand.commandAction.apply(this, actionArgs)
}

export = class FCli extends EventEmitter implements FCli.Cli {
  /** The program name to display in help and version message */
  name: string
  commands: FCliCommand.Command[]
  topLevelCommand: FCliCommand.GlobalCommand

  matchedCommand?: FCliCommand.Command
  matchedCommandName?: string
  /**
   * Raw CLI arguments
   */
  rawArgs: string[]
  /**
   * Parsed CLI arguments
   */
  args: FCliArgv.MriResult['args']
  /**
   * Parsed CLI options, camelCased
   */
  options: FCliArgv.MriResult['options']
  /**
   * Raw CLI options, i.e. not camelcased
   */
  rawOptions: FCliArgv.MriResult['rawOptions']

  /**
   * @param name The program name to display in help and version message
   */
  constructor(name: string = '') {
    super()
    this.name = name
    this.commands = []

    setupTopLevelCmd.call(this)
  }

  /**
   * Add a global usage text.
   *
   * This is not used by sub-commands.
   */
  usage(text: string) {
    this.topLevelCommand.usage(text)
    return this
  }

  /**
   * Add a sub-command
   */
  command(raw: string, description?: string, config?: FCliCommand.Config) {
    const command = new FCliCommand(raw, description || '', config, this)
    command.topLevelCommand = this.topLevelCommand
    this.commands.push(command)
    return command
  }

  /**
   * Add a global CLI option.
   *
   * Which is also applied to sub-commands.
   */
  option(raw: string, description: string, config?: FCliOption.OptionConfig) {
    this.topLevelCommand.option(raw, description, config)
    return this
  }

  /**
   * Show help message when `-h, --help` flags appear.
   *
   */
  help(callback?: FCliCommon.HelpCallback) {
    this.topLevelCommand.option('-h, --help', 'Display this message')
    if (callback && typeof callback !== 'function')
      throw `In .help(callback), non-empty callback must be one function, or leave it as 'undefined'`

    this.topLevelCommand.helpCallback = callback

    return this
  }

  /**
   * Show version number when `-v, --version` flags appear.
   *
   */
  version(version: string, customFlags = '-v, --version') {
    this.topLevelCommand.version(version, customFlags)

    return this
  }

  /**
   * Add a global example.
   *
   * This example added here will not be used by sub-commands.
   */
  example(example: FCliCommand.CommandExample) {
    this.topLevelCommand.example(example)
    return this
  }

  /**
   * Parse argv
   */
  parse (argvs: string[] = DEFAULT_ARGS, opts?: { run?: boolean }): FCliArgv.ParsedArgv {
    const  {
      /** Whether to run the action for matched command */
      run = true
    } = opts || {};

    Utils.addHiddenChangeableProperty(this, 'rawArgs', argvs.slice())
    // this.rawArgs = argvs

    if (!this.name)
      this.name = argvs[1] ? Utils.getProgramAppFromFilepath(argvs[1]) : 'cli'

    let shouldParseDefault = true

    // Search sub-commands
    for (const command of this.commands) {
      const parsedCmdResult = parseCliCommand(argvs.slice(2), this.topLevelCommand, command)

      const commandName = parsedCmdResult.args[0]

      if (command.isCommandMatched(commandName)) {
        shouldParseDefault = false
        const parsedInfo = {
          ...parsedCmdResult,
          args: parsedCmdResult.args.slice(1)
        }

        setParsedInfo.call(this, parsedInfo, command, commandName)
        this.emit(`command:${commandName}`, command)
      }
    }

    if (shouldParseDefault) {
      // Search the default command
      for (const command of this.commands) {
        if (command.name === '') {
          shouldParseDefault = false
          const parsedCmdResult = parseCliCommand(argvs.slice(2), this.topLevelCommand, command)
          setParsedInfo.call(this, parsedCmdResult, command)
          this.emit(`command:!`, command)
        }
      }
    }

    if (shouldParseDefault) {
      const parsedCmdResult = parseCliCommand(argvs.slice(2), this.topLevelCommand)
      setParsedInfo.call(this, parsedCmdResult)
    }

    if (this.options.help && showHelpOnExit(this))
      this.outputHelp()

    if (this.options.version && showVersionOnExit(this))
      this.outputVersion()

    const parsedArgv = { args: this.args, options: this.options }

    if (run)
      runMatchedCommand(this)

    if (!this.matchedCommand && this.args[0])
      this.emit('command:*')

    return parsedArgv
  }

  /**
   * Output the corresponding help message
   * When a sub-command is matched, output the help message for the command
   * Otherwise output the global one.
   *
   * This will also call `process.exit(0)` to quit the process.
   */
  outputHelp() {
    if (this.matchedCommand)
      this.matchedCommand.outputHelp()
    else
      this.topLevelCommand.outputHelp()
  }

  /**
   * Output the version number.
   *
   * This will also call `process.exit(0)` to quit the process.
   */
  outputVersion() {
    this.topLevelCommand.outputVersion()
  }
}

function parseCliCommand(
  argv: string[],
  topLevelCommand: FCli.Cli['topLevelCommand'],
  /** Matched command */
  command?: FCliCommand.Command
): FCliArgv.MriResult {
  // All added options
  const cliOptions: FCli.Cli['topLevelCommand']['options'] = [
    ...topLevelCommand.options,
    ...(command ? command.options : [])
  ]

  const mriOptions = Utils.getMriOptions(cliOptions)

  // Extract everything after `--` since mri doesn't support it
  let argsAfterDoubleDashes: string[] = []
  const doubleDashesIndex = argv.indexOf('--')
  if (doubleDashesIndex > -1) {
    argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1)
    argv = argv.slice(0, doubleDashesIndex)
  }

  const parsed = Mri(argv, mriOptions)

  const args = parsed._
  delete parsed._

  const options: { [k: string]: any } = {
    '--': argsAfterDoubleDashes
  }

  // Set option default value
  const ignoreDefault =
    command && command.config.ignoreOptionDefaultValue
      ? command.config.ignoreOptionDefaultValue
      : topLevelCommand.config.ignoreOptionDefaultValue

  let transforms = Object.create(null)

  for (const cliOption of cliOptions) {
    if (!ignoreDefault && cliOption.config.default !== undefined) {
      for (const name of cliOption.names) {
        options[name] = cliOption.config.default
      }
    }

    // If options type is defined
    if (Array.isArray(cliOption.config.type)) {
      if (transforms[cliOption.name] === undefined) {
        transforms[cliOption.name] = Object.create(null)

        transforms[cliOption.name]['shouldTransform'] = true
        transforms[cliOption.name]['transformFunction'] = cliOption.config.type[0]
      }
    }
  }

  // Camelcase option names and set dot nested option values
  for (const key of Object.keys(parsed)) {
    const keys = key.split('.').map((v, i) => {
      return i === 0 ? Utils.camelCase(v) : v
    })
    Utils.setDotProp(options, keys, parsed[key])
    Utils.setByType(options, transforms)
  }

  return {
    args,
    options,
    rawOptions: parsed
  }
}
