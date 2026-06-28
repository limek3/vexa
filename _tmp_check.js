
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const base = process.argv[2];
const files = JSON.parse(process.argv[3]);
let ok = true;
for (const rel of files) {
  const file = path.join(base, rel);
  const source = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      allowJs: true,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  if (out.diagnostics && out.diagnostics.length) {
    ok = false;
    console.log('FILE', rel);
    for (const d of out.diagnostics) {
      console.log(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    }
  }
}
process.exit(ok ? 0 : 1);
