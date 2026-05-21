/**
 * Legacy Render start commands use `node dist/src/main`.
 * Nest outputs `dist/main.js` — this shim forwards to the real entry.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'dist', 'src');
const file = path.join(dir, 'main.js');

if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'main.js'))) {
  console.error('render-shim: dist/main.js missing — run npm run build first');
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  file,
  "// Auto-generated — do not edit\nrequire('../main.js');\n",
);
console.log('render-shim: wrote dist/src/main.js');
