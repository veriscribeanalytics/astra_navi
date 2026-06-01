// Merge scripts/round3_translated_<locale>.json into src/locales/<locale>.json.
// Each translated file is a flat JSON: { "dotted.key.path": "translated value" }.
// We rebuild the nested structure to match en.json's shape.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

function setDeep(obj, dottedPath, value) {
  // Path syntax: a.b[0].c.d  -> nested with array indices
  const tokens = [];
  let cur = '';
  for (let i = 0; i < dottedPath.length; i++) {
    const ch = dottedPath[i];
    if (ch === '.') {
      if (cur) { tokens.push({ kind: 'key', name: cur }); cur = ''; }
    } else if (ch === '[') {
      if (cur) { tokens.push({ kind: 'key', name: cur }); cur = ''; }
      const end = dottedPath.indexOf(']', i);
      tokens.push({ kind: 'idx', name: parseInt(dottedPath.slice(i + 1, end), 10) });
      i = end;
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push({ kind: 'key', name: cur });

  let node = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    const nextT = tokens[i + 1];
    const nextEmpty = nextT.kind === 'idx' ? [] : {};
    if (t.kind === 'key') {
      if (node[t.name] === undefined || node[t.name] === null) node[t.name] = nextEmpty;
      node = node[t.name];
    } else {
      if (node[t.name] === undefined || node[t.name] === null) node[t.name] = nextEmpty;
      node = node[t.name];
    }
  }
  const last = tokens[tokens.length - 1];
  node[last.name] = value;
}

let totalAdded = 0;
const report = {};

for (const code of TARGETS) {
  const translatedFile = path.join(__dirname, `round3_translated_${code}.json`);
  if (!fs.existsSync(translatedFile)) {
    console.log(`SKIP ${code}: no translated file at ${translatedFile}`);
    continue;
  }
  const translated = JSON.parse(fs.readFileSync(translatedFile, 'utf8'));
  const localeFile = path.join(LOCALES_DIR, `${code}.json`);
  const loc = JSON.parse(fs.readFileSync(localeFile, 'utf8'));

  let added = 0;
  for (const [k, v] of Object.entries(translated)) {
    setDeep(loc, k, v);
    added++;
  }

  fs.writeFileSync(localeFile, JSON.stringify(loc, null, 2) + '\n', 'utf8');
  totalAdded += added;
  report[code] = added;
  console.log(`${code}: merged ${added} keys`);
}

console.log(`\nTotal: ${totalAdded} keys merged across ${Object.keys(report).length} locales`);
