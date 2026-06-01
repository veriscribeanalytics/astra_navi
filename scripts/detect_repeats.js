// Detect repeated words within a value (e.g., "you you are", broken Haiku output)
// and trailing/leading whitespace.

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

let totalIssues = 0;
for (const code of TARGETS) {
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const issues = [];
  for (const [key, value] of flatten(loc)) {
    if (typeof value !== 'string') continue;
    const problems = [];

    // Trailing/leading whitespace
    if (value !== value.trim()) problems.push('whitespace');

    // Repeated word (same word twice in a row) — words separated by space
    const tokens = value.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      const a = tokens[i - 1].replace(/[.,;:!?।॥()"'\-]/g, '');
      const b = tokens[i].replace(/[.,;:!?।॥()"'\-]/g, '');
      if (a && a === b && a.length >= 2) {
        problems.push(`repeated word "${a}"`);
        break;
      }
    }

    // Double placeholder runs like "{n}{n}"
    if (/\{[a-zA-Z_]+\}\{[a-zA-Z_]+\}/.test(value)) {
      // Could be intentional (e.g., "{name}{title}") — skip unless same name
      const m = value.match(/\{([a-zA-Z_]+)\}\{([a-zA-Z_]+)\}/);
      if (m && m[1] === m[2]) problems.push('duplicate placeholder');
    }

    // Two same consecutive characters at unusual length (e.g., "...." dots are fine, "؟؟؟" 3 question marks ok)
    // Skip — too noisy

    // Lone punctuation (just a "?", "!", etc.) when en source is longer is caught by length detector

    if (problems.length) {
      issues.push({ key, value, problems });
    }
  }
  if (issues.length) {
    console.log(`\n──── ${code}.json (${issues.length} issues) ────`);
    issues.slice(0, 15).forEach(i => {
      console.log(`  ${i.key}: ${i.problems.join(', ')}`);
      console.log(`    value: ${JSON.stringify(i.value.slice(0, 100))}`);
    });
    if (issues.length > 15) console.log(`    ... and ${issues.length - 15} more`);
    totalIssues += issues.length;
  } else {
    console.log(`${code}.json: clean`);
  }
}
console.log(`\nTotal repeat/whitespace issues: ${totalIssues}`);
