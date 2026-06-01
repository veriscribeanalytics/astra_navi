// Detect script-mixing in locale values.
// For each locale, scan every leaf string. Characters should belong to either:
//   (a) the locale's expected script,
//   (b) ASCII (for brand names, placeholders, etc.),
//   (c) common punctuation and digits.
// Any character from a foreign Indic / Korean script in the value is a bug.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Unicode script ranges
const RANGES = {
  devanagari: [0x0900, 0x097F],
  bengali:    [0x0980, 0x09FF],
  gurmukhi:   [0x0A00, 0x0A7F],
  gujarati:   [0x0A80, 0x0AFF],
  oriya:      [0x0B00, 0x0B7F],
  tamil:      [0x0B80, 0x0BFF],
  telugu:     [0x0C00, 0x0C7F],
  kannada:    [0x0C80, 0x0CFF],
  malayalam:  [0x0D00, 0x0D7F],
  sinhala:    [0x0D80, 0x0DFF],
  hangul:     [0xAC00, 0xD7AF],
  hangulJamo: [0x1100, 0x11FF],
  hangulCompat: [0x3130, 0x318F],
  // Foreign scripts that should NEVER appear in any of our target locales
  cyrillic:   [0x0400, 0x04FF],
  greek:      [0x0370, 0x03FF],
  arabic:     [0x0600, 0x06FF],
  hebrew:     [0x0590, 0x05FF],
  thai:       [0x0E00, 0x0E7F],
  cjkHan:     [0x4E00, 0x9FFF], // Chinese hanzi (Korean should use Hangul, not CJK)
};

// Locale -> expected script(s)
const EXPECTED = {
  hi: ['devanagari'],
  mr: ['devanagari'],
  bn: ['bengali'],
  pa: ['gurmukhi'],
  gu: ['gujarati'],
  ta: ['tamil'],
  te: ['telugu'],
  kn: ['kannada'],
  ml: ['malayalam'],
  ko: ['hangul', 'hangulJamo', 'hangulCompat'],
};

// U+0964 (।) and U+0965 (॥) are conventionally used across all Indic scripts
// as sentence terminators, despite being in the Devanagari block. Skip them.
const UNIVERSAL_INDIC = new Set([0x0964, 0x0965]);

function codePointScript(cp) {
  if (UNIVERSAL_INDIC.has(cp)) return null;
  for (const [name, [lo, hi]] of Object.entries(RANGES)) {
    if (cp >= lo && cp <= hi) return name;
  }
  return null;
}

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
    return out;
  }
  out[prefix] = obj;
  return out;
}

let totalIssues = 0;

for (const [code, expected] of Object.entries(EXPECTED)) {
  const expectedSet = new Set(expected);
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const flat = flatten(loc);
  const issues = [];
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string') continue;
    const foreignChars = new Map(); // script -> char
    for (const ch of value) {
      const cp = ch.codePointAt(0);
      const s = codePointScript(cp);
      if (!s) continue;
      if (!expectedSet.has(s)) {
        if (!foreignChars.has(s)) foreignChars.set(s, []);
        foreignChars.get(s).push(ch);
      }
    }
    if (foreignChars.size > 0) {
      const description = [...foreignChars.entries()].map(([s, chars]) => `${s}: ${chars.slice(0, 6).join('')}`).join(' | ');
      issues.push({ key, value, description });
    }
  }
  if (issues.length) {
    console.log(`\n──── ${code}.json (${issues.length} script-mixing issues) ────`);
    issues.slice(0, 25).forEach(i => {
      const preview = i.value.length > 80 ? i.value.slice(0, 80) + '...' : i.value;
      console.log(`  ${i.key}`);
      console.log(`    value:   ${JSON.stringify(preview)}`);
      console.log(`    foreign: ${i.description}`);
    });
    if (issues.length > 25) console.log(`    ... and ${issues.length - 25} more`);
    totalIssues += issues.length;
  } else {
    console.log(`${code}.json: clean`);
  }
}

console.log(`\nTotal script-mixing issues: ${totalIssues}`);
