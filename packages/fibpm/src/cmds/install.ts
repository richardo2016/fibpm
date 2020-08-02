import FCli = require("@fxjs/cli/typings/Cli");

export default function addCmdInstall (cli: FCli) {
    const installCmd = cli
        .command('install [...pkgs]', 'install package from npm-style registry', {
            allowUnknownOptions: true
        })

        installCmd.alias('add')
        installCmd.alias('i')

        installCmd.option('-S, --save', 'default behavior')
        
        installCmd.example((bin) => {
            return [
                `  ` + `${bin} install (with no args, in package dir)`,
                `  ` + `${bin} install [<@scope>/]<pkg>`,
                `  ` + `${bin} install [<@scope>/]<pkg>@<tag>`,
                `  ` + `${bin} install [<@scope>/]<pkg>@<version>`,
                `  ` + `${bin} install [<@scope>/]<pkg>@<version range>`,
                `  ` + `${bin} install <alias>@${bin}:<name>`,
                `  ` + `${bin} install <folder>`,
                `  ` + `${bin} install <tarball file>`,
                `  ` + `${bin} install <tarball url>`,
                `  ` + `${bin} install <git:// url>`,
                `  ` + `${bin} install <github username>/<github project>`,
            ].join('\n')
        })
        
        installCmd.action((pkgs, options) => {
            if (options.help) {
                console.notice('output help')
                return
            }
        });
}