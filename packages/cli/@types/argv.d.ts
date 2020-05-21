declare namespace FCliArgv {
    interface ParsedArgv {
        args: ReadonlyArray<string>
        options: {
            [k: string]: any
        }
    }

    interface RestrainedMriOptions {
        alias: { [k: string]: string[] }
        boolean: string[]
    }

    interface MriResult extends ParsedArgv {
        rawOptions: { [k: string]: any }
    }
}