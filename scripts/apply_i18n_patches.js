// Apply scratch/i18n-patches/<locale>.json (flat dotted keys) into
// src/locales/<locale>.json, preserving the existing CRLF line endings and
// 2-space indent. Validates that every patch key exists in en.json before
// touching the target, and preserves placeholder tokens {name} etc.
//
// Usage: node scripts/apply_i18n_patches.js

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
const report = {};

for (const code of TARGETS) {
  const patchFile = path.join(PATCH_DIR, `${code}.json`);
  if (!fs.existsSync(patchFile)) {
    console.log(`SKIP ${code}: no patch file at ${patchFile}`);
    continue;
  }
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  const localeFile = path.join(LOCALES_DIR, `${code}.json`);
  const loc = JSON.parse(fs.readFileSync(localeFile, 'utf8'));

  let applied = 0;
  const errors = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in enFlat)) {
      errors.push(`${k}: not a valid en.json key — skipped`);
      continue;
    }
    if (typeof enFlat[k] === 'string' && typeof v === 'string') {
      const enTokens = placeholders(enFlat[k]);
      const vTokens = placeholders(v);
      const missing = [...enTokens].filter(t => !vTokens.has(t));
      if (missing.length) {
        errors.push(`${k}: missing placeholder(s) ${missing.join(', ')} — skipped`);
        continue;
      }
    }
    setDeep(loc, k, v);
    applied++;
  }

  if (errors.length) {
    console.log(`\n[${code}] ${errors.length} validation error(s):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }

  // Write back preserving CRLF + 2-space indent + trailing newline.
  const json = JSON.stringify(loc, null, 2) + '\n';
  fs.writeFileSync(localeFile, json.replace(/\n/g, '\r\n'), 'utf8');
  totalApplied += applied;
  report[code] = applied;
  console.log(`${code}: applied ${applied} keys`);
}

console.log(`\nTotal: ${totalApplied} keys applied across ${Object.keys(report).length} locales`);
