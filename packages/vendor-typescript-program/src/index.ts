import * as ts from "typescript";

import * as fs from 'fs';
import * as path from 'path';
const mkdirp = require('@fibjs/mkdirp')

/**
 * @description fibjs has similar file system APIs with NodeJS, which is default runtime of typescript.js.
 * 
 * We don't need re-implement all compilerHost APIs starting from scratch. Just fixup some error caused by
 * differences of fs-API between fibjs and NodeJS.
 * @param options 
 */
function createCompilerHost(options: ts.CompilerOptions) {
  const host = ts.createCompilerHost(options);

  host.writeFile = (fileName, contents, writeByteOrderMark, onError, sourceFiles) => {
    mkdirp(path.dirname(fileName));
    fs.writeTextFile(fileName, contents);

    return contents;
  }

  return host;
}

export function compile(fileNames: string[], options: ts.CompilerOptions): ts.EmitResult {
  const host = createCompilerHost(options);

  const program = ts.createProgram(fileNames, options, host);
  const emitResult = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  return emitResult;
}