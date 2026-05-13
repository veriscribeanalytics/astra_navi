/* eslint-disable */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/locales');

const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf-8'));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'en.json');

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      res.push(prefix + el);
      obj[el].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) res.push(...getKeys(item, prefix + el + '[' + index + '].'));
      });
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      res.push(...getKeys(obj[el], prefix + el + '.'));
    } else {
      res.push(prefix + el);
    }
    return res;
  }, []);
}

function getValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let val = obj;
  try {
    for (const part of parts) {
      const arrMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrMatch) {
        val = val[arrMatch[1]];
        if (!val) return undefined;
        val = val[parseInt(arrMatch[2])];
      } else {
        val = val[part];
      }
      if (val === undefined) return undefined;
    }
  } catch(e) {
    return undefined;
  }
  return val;
}

const enKeys = getKeys(en);
let totalIssues = 0;

for (const file of files) {
  const lang = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  let untranslated = 0;

  for (const key of enKeys) {
    const enVal = getValue(en, key);
    const locVal = getValue(data, key);
    if (typeof enVal === 'string' && typeof locVal === 'string' && enVal === locVal && enVal.length > 3) {
      console.log('[' + lang + '] UNTRANSLATED: ' + key + ' => "' + enVal.substring(0, 80) + '"');
      untranslated++;
    }
  }
  if (untranslated > 0) {
    console.log('[' + lang + '] Found ' + untranslated + ' untranslated strings');
    totalIssues += untranslated;
  } else {
    console.log('[' + lang + '] All strings translated. (0 untranslated)');
  }
}

console.log('');
console.log('TOTAL untranslated strings found: ' + totalIssues);