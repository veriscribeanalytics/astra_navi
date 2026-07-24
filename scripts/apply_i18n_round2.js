// Apply scratch/i18n-patches/r2_<locale>.json (round 2 stray-English fixes) into
// src/locales/<locale>.json, preserving CRLF + 2-space indent. Validates keys
// against en.json and placeholder tokens.
// Run: node scripts/apply_i18n_round2.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');
const PATCH_DIR = path.join(ROOT, 'scratch', 'i18n-patches');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
function flat(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
}
const enFlat = flat(en, '', {});

function setDeep(obj, dottedPath, value) {
  const parts = dottedPath.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (node[parts[i]] === undefined || node[parts[i]] === null) node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}
function placeholders(s) {
  const set = new Set();
  (String(s).match(/\{(\w+)\}/g) || []).forEach(m => set.add(m));
  return set;
}

let totalApplied = 0;
for (const code of TARGETS) {
  const patchFile = path.join(PATCH_DIR, `r2_${code}.json`);
  if (!fs.existsSync(patchFile)) { console.log(`SKIP ${code}: no r2 patch`); continue; }
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  const localeFile = path.join(LOCALES_DIR, `${code}.json`);
  const loc = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
  let applied = 0; const errors = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in enFlat)) { errors.push(`${k}: invalid en key`); continue; }
    if (typeof enFlat[k] === 'string' && typeof v === 'string') {
      const want = placeholders(enFlat[k]), got = placeholders(v);
      const missing = [...want].filter(t => !got.has(t));
      if (missing.length) { errors.push(`${k}: missing ${missing.join(',')}`); continue; }
    }
    setDeep(loc, k, v); applied++;
  }
  if (errors.length) { console.log(`[${code}] errors:`); errors.forEach(e => console.log('  - ' + e)); }
  fs.writeFileSync(localeFile, (JSON.stringify(loc, null, 2) + '\n').replace(/\n/g, '\r\n'), 'utf8');
  totalApplied += applied;
  console.log(`${code}: applied ${applied} keys`);
}
console.log(`\nTotal round 2: ${totalApplied} keys applied`);
