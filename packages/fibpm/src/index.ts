import FxCli = require('@fxjs/cli');

import addCmdInstall from './cmds/install';
import addCmdRun from './cmds/run';
import addCmdSearch from './cmds/search';

const pkgjson = require('../package.json');
const VER = pkgjson.version;

export function npm () {
    const cli = FxCli('fpm');

    addCmdInstall(cli);
    addCmdRun(cli);
    addCmdSearch(cli);

    cli.help();

    cli.version(VER);

    return cli;
}
