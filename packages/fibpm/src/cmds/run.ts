import FCli = require("@fxjs/cli/typings/Cli");

export default function addCmdRun (cli: FCli) {
    const cmd = cli
        .command('run-script <command>', 'run command in package.json', {
            allowUnknownOptions: true
        })

        cmd.alias('run')
        
        cmd.action((scommand, options) => {
            console.log(`scommand is ${scommand}`)
        });
}