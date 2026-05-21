const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
const bn = JSON.parse(fs.readFileSync(path.join(localesDir, 'bn.json'), 'utf-8'));

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      res.push(prefix + el);
      obj[el].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          res.push(...getKeys(item, `${prefix}${el}[${index}].`));
        }
      });
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      res.push(...getKeys(obj[el], `${prefix}${el}.`));
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
const bnKeys = new Set(getKeys(bn));

const missing = [];
const untranslated = [];

for (const key of enKeys) {
  const enVal = getValue(en, key);
  if (!bnKeys.has(key)) {
    missing.push({ key, enVal });
  } else {
    const bnVal = getValue(bn, key);
    if (typeof enVal === 'string' && typeof bnVal === 'string' && enVal === bnVal && enVal.length > 0) {
      // Exclude brand and extension tokens from untranslated list
      if (
        key === 'login.googleSignIn' ||
        key === 'chat.sidebar.downloadTxt' ||
        key === 'chat.sidebar.downloadJson' ||
        key === 'chat.sidebar.downloadRoleNavi'
      ) {
        continue;
      }
      // Also ignore if the English value is "Navi" or "AstraNavi" verbatim
      if (enVal === 'Navi' || enVal === 'AstraNavi') {
        continue;
      }
      untranslated.push({ key, enVal, bnVal });
    }
  }
}

console.log(`Missing keys count: ${missing.length}`);
console.log(`Untranslated keys count: ${untranslated.length}`);

fs.writeFileSync(
  path.join(localesDir, 'bn_analysis.json'),
  JSON.stringify({ missing, untranslated }, null, 2),
  'utf-8'
);
console.log('Analysis written to src/locales/bn_analysis.json');
