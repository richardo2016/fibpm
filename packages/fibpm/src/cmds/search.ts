import npmCmder, { Commander } from '@fibpm/i-npm-commander';
import FCli = require("@fxjs/cli/typings/Cli");
import { makeTable, CHARS_CONFIG_SIMPLE, addEllipsisToOverLenCellContent, colorizeKeyword, WinCliType } from "../utils/cli-table";

export default function addCmdSearch (cli: FCli) {
    const cmd = cli
        .command('search <package>', 'search from npm-style registry', {
            allowUnknownOptions: true
        })
        
        cmd.action((pkgname, options) => {
            const results = npmCmder.searchAndGetIndexedInfo({
                keyword: pkgname,
                offset: 0,
                size: 10
            });

            if (results instanceof Error) {
                console.error(results);
                return ;
            }

            const searchedPkgs = results.objects.slice(0, 10);

            if (searchedPkgs.length === 0) {
                console.log(`No matches found for "${pkgname}"`)
                return ;
            }

            const table = makeTable({
                chars: CHARS_CONFIG_SIMPLE,
                head: [
                    'NAME',
                    'DESCRIPTION',
                    'AUTHOR',
                    'DATE',
                    'VERSION',
                    'KEYWORDS',
                ]
            });

            table.push(
                ...searchedPkgs.map(({ package: pkg, indexedInfo }) => {
                    return [
                        // NAME
                        colorizeKeyword(pkg.name, pkgname),
                        // DESCRIPTION
                        colorizeKeyword(addEllipsisToOverLenCellContent(
                            indexedInfo.description || ''
                        ), pkgname),
                        // AUTHOR
                        pkg.maintainers[0]?.username || '',
                        // DATE
                        pkg.date,
                        // VERSION
                        pkg.version,
                        // KEYWORDS
                        colorizeKeyword(addEllipsisToOverLenCellContent(
                            indexedInfo.keywords?.join(' ') || ''
                        ), pkgname)
                        
                    ]
                })
            );
            
            console.log(table.toString())
        });
}