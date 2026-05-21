// Merge scripts/round3_*.json into src/locales/en.json
// Deep-merges new namespaces (blogs.*, support.*) and adds new keys to existing ones (forecast.*, profile.*, plans.*).

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

const sources = ['blogs', 'profile', 'plans', 'forecast', 'support'];

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    const v = source[key];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], v);
    } else {
      target[key] = v;
    }
  }
  return target;
}

function countLeaves(obj) {
  if (obj === null || obj === undefined) return 0;
  if (Array.isArray(obj)) return obj.reduce((a, v) => a + countLeaves(v), 0);
  if (typeof obj === 'object') return Object.values(obj).reduce((a, v) => a + countLeaves(v), 0);
  return 1;
}

const before = countLeaves(en);
const summary = {};

for (const s of sources) {
  const f = path.join(__dirname, `round3_${s}.json`);
  if (!fs.existsSync(f)) {
    console.log(`! skipped (missing): ${f}`);
    continue;
  }
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  const beforeArea = countLeaves(en);
  deepMerge(en, obj);
  const afterArea = countLeaves(en);
  summary[s] = afterArea - beforeArea;
}

const after = countLeaves(en);

fs.writeFileSync(path.join(LOCALES_DIR, 'en.json'), JSON.stringify(en, null, 2) + '\n', 'utf8');

console.log('en.json keys: ' + before + ' -> ' + after + ' (+' + (after - before) + ')');
for (const s of sources) console.log('  ' + s + ': +' + (summary[s] ?? 0));
