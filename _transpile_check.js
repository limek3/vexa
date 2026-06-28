
const ts = require('typescript');
const fs = require('fs');
const files = process.argv.slice(2);
let failed = false;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  const diagnostics = (result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length) {
    failed = true;
    console.log('\nFILE', file);
    for (const d of diagnostics) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      console.log(msg);
    }
  }
}
process.exit(failed ? 1 : 0);
