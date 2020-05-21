/// <reference types="@fibjs/types" />

/// <reference path="./_common.d.ts" />
/// <reference path="./command.d.ts" />
/// <reference path="./option.d.ts" />
/// <reference path="./argv.d.ts" />

declare module "minimist"
declare module "mri"

declare namespace FCli {
    class Cli extends Class_EventEmitter {
        constructor(name: string);
        /**
         * program's name
         */
        name: string

        commands: FCliCommand.Command[]

        args: FCliArgv.MriResult['args']
        options: FCliArgv.MriResult['options']

        // matched: { [k: string]: FCliCommand.Command }
        matchedCommand?: FCliCommand.Command
        matchedCommandName?: string

        topLevelCommand: FCliCommand.Command
        rawOptions: {
            [k: string]: FCliOption.Option | boolean
        }
        /**
         * @description output help message when -h, --help flag appears.
         * @param callback(optional) post-processing of help text before its output.
         */
        help (callback?: (this: FCli.Cli, sections: FCliCommon.HelpSection[]) => void): this;
        /**
         * @description set program's version
         * @param semver semver string
         */
        version (semver: string): this;
        /**
         * @description add Option
         */
        option (name: string, description: string, config?: {}): this;

        parse (argvs?: string[], opts?: { run?: boolean }): FCliArgv.ParsedArgv;
    }

    interface ExportModule {
        (name: string): Cli
    }
}

declare module "@fxjs/cli" {
    const mod: FCli.ExportModule
    export = mod
}
