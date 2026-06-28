
const ts = require('typescript');
const fs = require('fs');
const files = process.argv.slice(2);
let ok = true;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  const diags = result.diagnostics || [];
  if (diags.length) {
    ok = false;
    console.log('FILE', file);
    for (const d of diags) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
      console.log(pos ? `${pos.line+1}:${pos.character+1}` : '', msg);
    }
  }
}
if (ok) console.log('OK');
