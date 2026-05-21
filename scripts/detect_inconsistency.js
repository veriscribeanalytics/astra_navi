// Consistency check: when the same English value appears under multiple keys in en.json,
// each locale should use the same translated value across those keys. Outliers indicate
// inconsistent translation choices (not always wrong, but worth a look).

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

function flatten(obj, prefix = '', out = []) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) { obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out)); return out; }
  if (typeof obj === 'object') { for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out); return out; }
  out.push([prefix, obj]);
  return out;
}

function getDeep(obj, dottedPath) {
  let cur = obj, buf = '';
  for (let i = 0; i < dottedPath.length; i++) {
    const c = dottedPath[i];
    if (c === '.') { if (buf) { cur = cur[buf]; buf = ''; } }
    else if (c === '[') {
      if (buf) { cur = cur[buf]; buf = ''; }
      const end = dottedPath.indexOf(']', i);
      cur = cur[parseInt(dottedPath.slice(i + 1, end), 10)];
      i = end;
    } else buf += c;
  }
  if (buf) cur = cur[buf];
  return cur;
}

const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const enEntries = flatten(en);

// Group keys by their English value
const byEnValue = new Map();
for (const [key, val] of enEntries) {
  if (typeof val !== 'string' || val.length < 4) continue;
  if (!byEnValue.has(val)) byEnValue.set(val, []);
  byEnValue.get(val).push(key);
}

// Only check values that appear in ≥2 keys
const duplicateGroups = [...byEnValue.entries()].filter(([_, keys]) => keys.length >= 2);

let totalIssues = 0;
for (const code of TARGETS) {
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const issues = [];
  for (const [enVal, keys] of duplicateGroups) {
    const locValues = new Map();
    for (const k of keys) {
      const v = getDeep(loc, k);
      if (typeof v !== 'string') continue;
      if (!locValues.has(v)) locValues.set(v, []);
      locValues.get(v).push(k);
    }
    if (locValues.size >= 2) {
      // Inconsistent — log
      issues.push({ enVal, keys, locValues });
    }
  }
  if (issues.length) {
    console.log(`\n──── ${code}.json (${issues.length} inconsistencies) ────`);
    issues.slice(0, 10).forEach(i => {
      console.log(`  en: ${JSON.stringify(i.enVal)}`);
      for (const [v, ks] of i.locValues) {
        console.log(`    ${JSON.stringify(v)} -> [${ks.join(', ')}]`);
      }
    });
    if (issues.length > 10) console.log(`    ... and ${issues.length - 10} more`);
    totalIssues += issues.length;
  } else {
    console.log(`${code}.json: consistent`);
  }
}
console.log(`\nTotal inconsistencies: ${totalIssues}`);
