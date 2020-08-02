import FxCli = require('@fxjs/cli');
import addCmdInstall from './cmds/install';

const pkgjson = require('../package.json');
const VER = pkgjson.version;

export function npm () {
    const cli = FxCli('fpm');

    addCmdInstall(cli);

    cli.help();

    cli.version(VER);

    return cli;
}
