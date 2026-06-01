// Apply suggested fixes from scripts/review_*.json files to locale files.
// Each review JSON has { locale, issues: [{ key, en, current, issue, explanation, suggested }] }
// We apply `suggested` to the locale at the given key path.
//
// SAFETY GUARDS:
// 1. Skip if key path doesn't exist in the locale.
// 2. Skip if current value in file no longer matches the `current` field (translation already changed).
// 3. Skip the landing.slides[1] title1/titleHighlight "swap" — it's a false positive
//    (en source has the same structure; reviewers misread the labels).
// 4. Validate that `suggested` is a non-empty string.
// 5. Log every action.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

const SKIP_KEYS = new Set([
  'landing.slides[1].title1',
  'landing.slides[1].titleHighlight',
]);

function getDeep(obj, dottedPath) {
  let cur = obj;
  let buf = '';
  for (let i = 0; i < dottedPath.length; i++) {
    if (cur === undefined || cur === null) return undefined;
    const c = dottedPath[i];
    if (c === '.') { if (buf) { cur = cur[buf]; buf = ''; } }
    else if (c === '[') {
      if (buf) { cur = cur[buf]; buf = ''; }
      const end = dottedPath.indexOf(']', i);
      if (cur === undefined) return undefined;
      cur = cur[parseInt(dottedPath.slice(i + 1, end), 10)];
      i = end;
    } else buf += c;
  }
  if (buf && cur !== undefined && cur !== null) cur = cur[buf];
  return cur;
}

function setDeep(obj, dottedPath, value) {
  const tokens = [];
  let buf = '';
  for (let i = 0; i < dottedPath.length; i++) {
    const c = dottedPath[i];
    if (c === '.') { if (buf) { tokens.push(buf); buf = ''; } }
    else if (c === '[') {
      if (buf) { tokens.push(buf); buf = ''; }
      const end = dottedPath.indexOf(']', i);
      tokens.push(parseInt(dottedPath.slice(i + 1, end), 10));
      i = end;
    } else buf += c;
  }
  if (buf) tokens.push(buf);
  let node = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (node[tokens[i]] === undefined) return false;
    node = node[tokens[i]];
  }
  node[tokens[tokens.length - 1]] = value;
  return true;
}

const summary = {};
let totalApplied = 0;
let totalSkipped = 0;
const skipReasons = { not_found: 0, mismatch: 0, false_positive: 0, invalid_suggested: 0, same_value: 0 };

for (const code of TARGETS) {
  const reviewFile = path.join(__dirname, `review_${code}.json`);
  if (!fs.existsSync(reviewFile)) {
    console.log(`SKIP ${code}: no review file`);
    continue;
  }
  const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  const localeFile = path.join(LOCALES_DIR, `${code}.json`);
  const loc = JSON.parse(fs.readFileSync(localeFile, 'utf8'));

  let applied = 0;
  let skipped = 0;
  const skipDetails = [];

  for (const issue of review.issues || []) {
    const { key, current, suggested } = issue;

    if (SKIP_KEYS.has(key)) {
      skipped++; skipReasons.false_positive++;
      skipDetails.push(`  - ${key}: FALSE POSITIVE (intentional structure)`);
      continue;
    }
    if (!suggested || typeof suggested !== 'string' || !suggested.trim()) {
      skipped++; skipReasons.invalid_suggested++;
      skipDetails.push(`  - ${key}: no valid suggested value`);
      continue;
    }
    const actual = getDeep(loc, key);
    if (actual === undefined) {
      skipped++; skipReasons.not_found++;
      skipDetails.push(`  - ${key}: key not found in ${code}.json`);
      continue;
    }
    if (actual === suggested) {
      skipped++; skipReasons.same_value++;
      skipDetails.push(`  - ${key}: already matches suggested`);
      continue;
    }
    if (current && typeof current === 'string' && actual !== current) {
      // Translation already changed since review — be conservative, skip
      skipped++; skipReasons.mismatch++;
      skipDetails.push(`  - ${key}: current mismatch (file has different value)`);
      continue;
    }
    if (!setDeep(loc, key, suggested)) {
      skipped++; skipReasons.not_found++;
      skipDetails.push(`  - ${key}: setDeep failed`);
      continue;
    }
    applied++;
  }

  fs.writeFileSync(localeFile, JSON.stringify(loc, null, 2) + '\n');
  summary[code] = { applied, skipped, total: review.issues.length };
  totalApplied += applied;
  totalSkipped += skipped;

  console.log(`\n${code}: ${applied} applied, ${skipped} skipped (of ${review.issues.length} total)`);
  if (skipDetails.length) skipDetails.forEach(d => console.log(d));
}

console.log(`\n=== Summary ===`);
console.log(`Total: ${totalApplied} applied, ${totalSkipped} skipped`);
console.log(`Skip reasons:`);
for (const [r, n] of Object.entries(skipReasons)) if (n) console.log(`  ${r}: ${n}`);
