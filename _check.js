
const fs = require('fs');
const ts = require('./node_modules/typescript');
const files = process.argv.slice(1);
let ok = true;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  try {
    ts.transpileModule(src, {
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
      },
      fileName: file,
      reportDiagnostics: true,
    });
    console.log('OK', file);
  } catch (err) {
    ok = false;
    console.error('ERR', file, err && err.message || err);
  }
}
process.exit(ok ? 0 : 1);
