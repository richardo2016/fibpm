/// <reference types="@fibjs/types" />

/// <reference path="subcommand-install.d.ts" />

declare namespace ColiFpm {
    /**
     * record process, profile and result of one subcommnd's executation
     */
    interface CmdExecutationReport {
        cmd: keyof Fpm
    }

    class FpmCommands {
        install(target: string): CmdExecutationReport
    }

    interface Fpm extends FpmCommands {
    }

    interface ExportModule {
        (): Fpm
    }
}

declare module "@coli/fpm" {
    var mod: any
    export = mod
}