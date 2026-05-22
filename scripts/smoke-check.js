const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('SMOKE CHECK FAILED:', msg);
  process.exit(2);
}

const dist = path.resolve(__dirname, '..', 'dist');
if (!fs.existsSync(dist)) fail('dist folder not found; ensure `npm run build` completed');

const index = path.join(dist, 'index.html');
if (!fs.existsSync(index)) fail('index.html missing in dist');

const assetsDir = path.join(dist, 'assets');
if (!fs.existsSync(assetsDir)) fail('assets directory missing in dist');

const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) fail('no JS assets found in dist/assets');

const largeEnough = jsFiles.some(f => fs.statSync(path.join(assetsDir, f)).size > 500);
if (!largeEnough) fail('JS assets appear too small; build may be incomplete');

console.log('SMOKE CHECK OK — dist contains index.html and JS assets');
process.exit(0);
