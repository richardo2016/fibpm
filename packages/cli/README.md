## @fibjs-mono-starter/cli

[![NPM version](https://img.shields.io/npm/v/@fibjs-mono-starter/cli.svg)](https://www.npmjs.org/package/@fibjs-mono-starter/cli)
[![Build Status](https://travis-ci.org/fibjs-mono-starter/fibjs-mono-starter.svg)](https://travis-ci.org/fibjs-mono-starter/fibjs-mono-starter)

## Introduction

**FCli** is a fibjs Cli builder, almost migration of [cac.js] from node.js to fibjs

## Features

- **Commander.js Like**: There's a large deal of users of [commander.js] in node.js ecosystem, FCli has similar APIs with [commander.js].
- **Easy to learn**. There're only 4 APIs you need to learn for building simple CLIs: `cli.option` `cli.version` `cli.help` `cli.parse`.
- **utility features**. Enable features like
  - default command
  - **git-like** subcommands
  - validation for required arguments and options
  - rest arguments
  - dot-nested options, automated help message generation and so on.

## Table of Contents

<!-- toc -->

- [Install](#install)
- [Usage](#usage)
  - [Simple Parsing](#simple-parsing)
  - [Display Help Message and Version](#display-help-message-and-version)
  - [Command-specific Options](#command-specific-options)
  - [Brackets](#brackets)
  - [Rest Arguments](#rest-arguments)
  - [Dot-style Options](#dot-nested-options)
  - [Default Command](#default-command)
  - [Supply an array as option value](#supply-an-array-as-option-value)
  - [With TypeScript](#with-typescript)
  - [With Deno](#with-deno)
- [References](#references)
  - [CLI Instance](#cli-instance)
    - [@fli/cli(name?)](#flicliname)
    - [cli.command(name, description, config?)](#clicommandname-description-config)
    - [cli.option(name, description, config?)](#clioptionname-description-config)
    - [cli.parse(argv?)](#cliparseargv)
    - [cli.version(version, customFlags?)](#cliversionversion-customflags)
    - [cli.help(callback?)](#clihelpcallback)
    - [cli.outputHelp(subCommand?)](#clioutputhelpsubcommand)
  - [Command Instance](#command-instance)
    - [command.option()](#commandoption)
    - [command.action(callback)](#commandactioncallback)
    - [command.alias(name)](#commandaliasname)
    - [command.allowUnknownOptions()](#commandallowunknownoptions)
    - [command.example(example)](#commandexampleexample)
  - [Events](#events)
- [FAQ](#faq)
  - [How is the name written and pronounced?](#how-is-the-name-written-and-pronounced)
  - [Why not use Commander.js?](#why-not-use-commanderjs)
- [Contributing](#contributing)
- [Author](#author)

<!-- tocstop -->

## Install

```bash
npm i -S @fli/cli
# or
fibjs --install @fli/cli
```

## Usage

### Simple Parsing

Use FCli as simple argument parser:

```js
// examples/basic-usage.js
const cli = require('@fli/cli')()

cli.option('--type <type>', 'Choose a project type', {
  default: 'node'
})

const parsed = cli.parse()

console.dir(parsed)
```

<img src="https://user-images.githubusercontent.com/6339390/58762798-09eab780-8586-11e9-8459-cdf361ddbf44.png" alt="image" style="max-width:100%;">

### Display Help Message and Version

```js
// examples/help.js
const cli = require('@fli/cli')()

cli.option('--type [type]', 'Choose a project type', {
  default: 'node'
})
cli.option('--name <name>', 'Provide your name')

cli.command('lint [...files]', 'Lint files').action((files, options) => {
  console.log(files, options)
})

// Display help message when `-h` or `--help` appears
cli.help()
// Display version number when `-v` or `--version` appears
// It's also used in help message
cli.version('0.0.0')

cli.parse()
```

<img src="https://user-images.githubusercontent.com/6339390/58762812-36063880-8586-11e9-9796-2b053db5dbf8.png" alt="image" style="max-width:100%;">

### Command-specific Options

You can attach options to a command.

```js
const cli = require('@fli/cli')()

cli
  .command('rm <dir>', 'Remove a dir')
  .option('-r, --recursive', 'Remove recursively')
  .action((dir, options) => {
    console.log('remove ' + dir + (options.recursive ? ' recursively' : ''))
  })

cli.help()

cli.parse()
```

A command's options are validated when the command is used. Any unknown options will be reported as an error. However, if an action-based command does not define an action, then the options are not validated. If you really want to use unknown options, use [`command.allowUnknownOptions`](#commandallowunknownoptions).

<img src="https://user-images.githubusercontent.com/6339390/58762857-9ac19300-8586-11e9-98c9-12add42e1d3a.png" alt="image" style="max-width:100%;">

### Brackets

When using brackets in command name, angled brackets indicate required command arguments, while square bracket indicate optional arguments.

When using brackets in option name, angled brackets indicate that a string / number value is required, while square bracket indicate that the value can also be `true`.

```js
const cli = require('@fli/cli')()

cli
  .command('deploy <folder>', 'Deploy a folder to AWS')
  .option('--scale [level]', 'Scaling level')
  .action((folder, options) => {
    // ...
  })

cli
  .command('build [project]', 'Build a project')
  .option('--out <dir>', 'Output directory')
  .action((folder, options) => {
    // ...
  })

cli.parse()
```

To allow an option whose value is `false`, you need to manually speicfy a negative option:

```js
cli
  .command('build [project]', 'Build a project')
  .option('--no-config', 'Disable config file')
  .option('--config <path>', 'Use a custom config file')
```

This will let FCli set the default value of `config` to true, and you can use `--no-config` flag to set it to `false`.

### Rest Arguments

The last argument of a command can be rest, and only the last argument. To make an argument rest you have to add `...` to the start of argument name, just like the rest operator in JavaScript. Here is an example:

```js
const cli = require('@fli/cli')()

cli
  .command('build <entry> [...otherFiles]', 'Build your app')
  .option('--foo', 'Foo option')
  .action((entry, otherFiles, options) => {
    console.log(entry)
    console.log(otherFiles)
    console.log(options)
  })

cli.help()

cli.parse()
```

<img src="https://user-images.githubusercontent.com/6339390/58765401-4da0e980-85a5-11e9-9c6c-2081b56ce8ef.png" alt="image" style="max-width:100%;">

### Dot-style Options

Dot-style options will be merged into a single option.

```js
const cli = require('@fli/cli')()

cli
  .command('build', 'desc')
  .option('--env <env>', 'Set envs')
  .example('--env.API_SECRET xxx')
  .action(options => {
    console.log(options)
  })

cli.help()

cli.parse()
```

<img src="https://user-images.githubusercontent.com/6339390/58762916-6e5a4680-8587-11e9-8e9b-7fb194a0c63e.png" alt="image" style="max-width:100%;">

### Default Command

Register a command that will be used when no other command is matched.

```js
const cli = require('@fli/cli')()

cli
  // Simply omit the command name, just brackets
  .command('[...files]', 'Build files')
  .option('--minimize', 'Minimize output')
  .action((files, options) => {
    console.log(files)
    console.log(options.minimize)
  })

cli.parse()
```

### Supply an array as option value

```bash
node cli.js --include project-a
# The parsed options will be:
# { include: 'project-a' }

node cli.js --include project-a --include project-b
# The parsed options will be:
# { include: ['project-a', 'project-b'] }
```

## References

### CLI Instance

CLI instance is created by invoking the `@fli/cli` function:

```js
const cli = require('@fli/cli')()
```

#### @fli/cli(name?)

Create a CLI instance, optionally specify the program name which will be used to display in help and version message. When not set we use the basename of `argv[1]`.

#### cli.command(name, description, config?)

- Type: `(name: string, description: string) => Command`

Create a command instance.

The option also accepts a third argument `config` for additional command config:

- `config.allowUnknownOptions`: `boolean` Allow unknown options in this command.
- `config.ignoreOptionDefaultValue`: `boolean` Don't use the options's default value in parsed options, only display them in help message.

#### cli.option(name, description, config?)

- Type: `(name: string, description: string, config?: OptionConfig) => CLI`

Add a global option.

The option also accepts a third argument `config` for additional option config:

- `config.default`: Default value for the option.
- `config.type`: `any[]` When set to `[]`, the option value returns an array type. You can also use a conversion function such as `[String]`, which will invoke the option value with `String`.

#### cli.parse(argv?)

- Type: `(argv = process.argv) => ParsedArgv`

```ts
interface ParsedArgv {
  args: string[]
  options: {
    [k: string]: any
  }
}
```

When this method is called, `cli.rawArgs` `cli.args` `cli.options` `cli.matchedCommand` will also be available.

#### cli.version(version, customFlags?)

- Type: `(version: string, customFlags = '-v, --version') => CLI`

Output version number when `-v, --version` flag appears.

#### cli.help(callback?)

- Type: `(callback?: HelpCallback) => CLI`

Output help message when `-h, --help` flag appears.

Optional `callback` allows post-processing of help text before it is displayed:

```ts
type HelpCallback = (sections: HelpSection[]) => void

interface HelpSection {
  title?: string
  body: string
}
```

#### cli.outputHelp(subCommand?)

- Type: `(subCommand?: boolean) => CLI`

Output help message. Optional `subCommand` argument if you want to output the help message for the matched sub-command instead of the global help message.

### Command Instance

Command instance is created by invoking the `cli.command` method:

```js
const command = cli.command('build [...files]', 'Build given files')
```

#### command.option()

Basically the same as `cli.option` but this adds the option to specific command.

#### command.action(callback)

- Type: `(callback: ActionCallback) => Command`

Use a callback function as the command action when the command matches user inputs.

```ts
type ActionCallback = (
  // Parsed CLI args
  // The last arg will be an array if it's an varadic argument
  ...args: string | string[] | number | number[]
  // Parsed CLI options
  options: Options
) => any

interface Options {
  [k: string]: any
}
```

#### command.alias(name)

- Type: `(name: string) => Command`

Add an alias name to this command, the `name` here can't contain brackets.

#### command.allowUnknownOptions()

- Type: `() => Command`

Allow unknown options in this command, by default FCli will log an error when unknown options are used.

#### command.example(example)

- Type: `(example: CommandExample) => Command`

Add an example which will be displayed at the end of help message.

```ts
type CommandExample = ((name: string) => string) | string
```

### Events

Listen to commands:

```js
// Listen to the `foo` command
cli.on('command:foo', () => {
  // Do something
})

// Listen to the default command
cli.on('command:!', () => {
  // Do something
})

// Listen to unknown commands
cli.on('command:*', () => {
  console.error('Invalid command: %', cli.args.join(' '))
  process.exit(1)
})
```

## Q & A

### Why not cac.js directly?

**@fli/cli** is inspired by [cac.js]

[cac.js] is one lightweight, fast cli builder for node.js/deno app, [egoist], author of [cac.js], were managed to make convenient and elegant tool for javascript ecosystem.

In fact, I trid to make PR to [cac.js] to make it support fibjs, in a way, it's much better than [commander.js] in  **cross-platform**, you would never find and node.js specific API in [cac.js]! As a contrast, `require('child_process')` is just writeen in [commander.js]'s source code, that made it difficult running [commander.js] in fibjs.

But there's some typically better APIs in fibjs that cac.js cannot use --- if do so, [cac.js]'s source code would contains many fibjs-only codes, useless for node.js/deno, that would mutilate elegant structure of [cac.js]

The 2nd best, I copid test cases and examples from [cac.js] as initial test case as **@fli/cli**, then I reimplement almost features of [cac.js] and add some fibjs specific features in **@fli/cli**. 

Thx much to [egoist] and other contributors' of [cac.js] :)

## License

- [MIT](./LICENSE)
- [cac.js MIT License]

[commander.js]:https://www.npmjs.com/package/commander
[cac.js]:https://github.com/cacjs/cac
[egoist]:https://github.com/egoist
[cac.js MIT License]:https://github.com/cacjs/cac/blob/e5f32f7c9dc83a4f12ccea2acbf43c814773c7f3/LICENSE
