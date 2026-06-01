// For each target locale, compute which leaf keys from en.json are missing,
// and write them as a flat JSON of { "dotted.key.path": "English value" }.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      flatten(v, next, out);
    }
    return out;
  }
  out[prefix] = obj;
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const enFlat = flatten(en);

for (const code of TARGETS) {
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const locFlat = flatten(loc);
  const missing = {};
  for (const k of Object.keys(enFlat)) {
    if (!(k in locFlat)) {
      missing[k] = enFlat[k];
    }
  }
  const outFile = path.join(__dirname, `round3_missing_${code}.json`);
  fs.writeFileSync(outFile, JSON.stringify(missing, null, 2) + '\n', 'utf8');
  console.log(`${code}: ${Object.keys(missing).length} missing keys -> ${path.relative(process.cwd(), outFile)}`);
}
