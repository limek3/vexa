
const fs = require('fs');
const postcss = require('postcss');
const css = fs.readFileSync('app/globals.css','utf8');
try {
  postcss.parse(css);
  console.log('postcss ok');
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
