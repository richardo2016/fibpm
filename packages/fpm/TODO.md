# TODO list

## Compabilities

- [ ] resolve `scripts` field in package.json
- [ ] install `npm` script as entry to for compat with existed npm package

## Features

- [ ] `fnpm install`
    - alias: `fnpm i`
    - alias: `fnpm add`
    - option: `--no-save`
    - option: `--save-exact`
    - option: `--save-prod`
    - option: `--save-dev`, `-S`
    - option: `--dev-dependency`, `-D`
    - targets
        - [ ]without args, install all packages in directory
        - [ ]`[<@scope>/]<pkg>`
        - [ ]`[<@scope>/]<pkg>@<tag>`
        - [ ]`[<@scope>/]<pkg>@<version>`
        - [ ]`[<@scope>/]<pkg>@<version range>`
        - [ ]`<alias>@npm:<name>`
        - [ ]`<folder>`
        - [ ]`<tarball file>`
        - [ ]`<tarball url>`
        - [ ]`<git:// url>`
        - [ ]`<github group>/<github project>`

