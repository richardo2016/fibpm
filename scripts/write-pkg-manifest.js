const fs = require('fs')
const path = require('path')

const mkdirp = require('@fibjs/mkdirp')
const readdirr = require('@fibjs/fs-readdir-recursive')

const ejs = require('ejs')

const monoInfo = require('../helpers/monoInfo')

const monoscope = monoInfo.monoScope
const scopePrefix = monoInfo.scopePrefix
const monoName = monoInfo.monoName

const PKG_DIR = path.resolve(__dirname, '../packages')
const TPL_PDIR = path.resolve(__dirname, '../tpls')
const PKG_JSON_NAME = 'package.json'

const packages = require('../helpers/packages')

const readJson = (jsonpath) => {
  let result = {}
  try {
    result = JSON.parse(fs.readFileSync(jsonpath))
  } catch (error) { }

  return result
}

const prettyJson = (content) => {
  return JSON.stringify(
    content, null, '\t'
  ) + '\n'
}

packages.forEach(({
  name: comname,
  isTopPackage,
  _dirname,
}) => {
  const comPkgname = _dirname || `${comname}`
  const comDirname = comPkgname
  const comDir = path.resolve(PKG_DIR, `./${comDirname}`)
  if (!fs.existsSync(comDir)) mkdirp(comDir)

  const TPL_DIR = path.resolve(TPL_PDIR, './starter')

  const files = readdirr(TPL_DIR, () => true)
  files.forEach((fname) => {
    const spath = path.resolve(TPL_DIR, fname)
    const tpath = path.resolve(comDir, fname)

    let existedTargetPkgJson = {}

    const target_existed = fs.exists(tpath)
    if (target_existed) {
      if (fname !== PKG_JSON_NAME)
        return ;
      else
        existedTargetPkgJson = readJson(tpath)
    }

    const pdir = path.dirname(tpath)
    if (!fs.existsSync(pdir)) mkdirp(pdir)

    const source = fs.readTextFile(spath)

    let output = ejs.render(source, {
      pkg: {
        name: comPkgname,
        npm_name: isTopPackage ? comPkgname : `${scopePrefix}/${comPkgname}`,
        git_group: monoInfo.monoscope,
        git_path: monoInfo.gitPath || `${monoscope}/${monoName}`,
        mono_path: `packages/${comPkgname}`,
        isTopPackage,
      }
    })

    if (fname === PKG_JSON_NAME) {
      output = JSON.parse(output)

      if (existedTargetPkgJson.dependencies) {
        output.dependencies = {
          ...existedTargetPkgJson.dependencies,
          ...output.dependencies,
        }
      }

      if (existedTargetPkgJson.devDependencies) {
        output.devDependencies = {
          ...existedTargetPkgJson.devDependencies,
          ...output.devDependencies,
        }
      }

      output.version = existedTargetPkgJson.version || output.version
      output.description = existedTargetPkgJson.description || output.description

      output = prettyJson(
        Object.assign({}, existedTargetPkgJson, output)
      )

      if (target_existed && prettyJson(existedTargetPkgJson) === output) return ;
    }
    
    fs.writeTextFile(tpath, output)

    console.info(`[output] write file ${tpath} successly`)
  })
})

console.info(`write pkg manifest success!`)