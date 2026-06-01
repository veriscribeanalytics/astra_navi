// Detect length anomalies: translations that are very different in character length
// from the English source. Indic and CJK scripts have different per-character density,
// but extreme outliers can indicate truncation or hallucination.
//
// Rule: flag if locale value length is <40% or >250% of English length, AND the
// English value is at least 10 chars. Brief values (≤10 chars) are too noisy.

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

function get(obj, dottedPath) {
  let cur = obj;
  let buf = '';
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

let totalIssues = 0;
for (const code of TARGETS) {
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const issues = [];
  for (const [key, enVal] of enEntries) {
    if (typeof enVal !== 'string') continue;
    if (enVal.length < 10) continue;
    const locVal = get(loc, key);
    if (typeof locVal !== 'string') continue;
    const ratio = locVal.length / enVal.length;
    if (ratio < 0.4 || ratio > 2.5) {
      issues.push({ key, enLen: enVal.length, locLen: locVal.length, ratio, en: enVal, loc: locVal });
    }
  }
  if (issues.length) {
    console.log(`\n──── ${code}.json (${issues.length} length anomalies) ────`);
    issues.sort((a, b) => (a.ratio < 1 ? a.ratio : 1 / a.ratio) - (b.ratio < 1 ? b.ratio : 1 / b.ratio));
    issues.slice(0, 15).forEach(i => {
      const dir = i.ratio < 1 ? `${(i.ratio * 100).toFixed(0)}% (shorter)` : `${(i.ratio * 100).toFixed(0)}% (longer)`;
      console.log(`  ${i.key}  en=${i.enLen} loc=${i.locLen}  ratio=${dir}`);
      console.log(`    en:  ${JSON.stringify(i.en.slice(0, 80))}${i.en.length > 80 ? '...' : ''}`);
      console.log(`    loc: ${JSON.stringify(i.loc.slice(0, 80))}${i.loc.length > 80 ? '...' : ''}`);
    });
    if (issues.length > 15) console.log(`    ... and ${issues.length - 15} more`);
    totalIssues += issues.length;
  } else {
    console.log(`${code}.json: clean`);
  }
}
console.log(`\nTotal length anomalies: ${totalIssues}`);
