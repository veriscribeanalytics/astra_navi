/* eslint-disable */
const fs = require('fs');
const path = require('path');

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      res.push(`${prefix}${el}`);
      obj[el].forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          res.push(...getKeys(item, `${prefix}${el}[${index}].`));
        }
      });
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      res.push(...getKeys(obj[el], `${prefix}${el}.`));
    } else {
      res.push(`${prefix}${el}`);
    }
    return res;
  }, []);
}

const localesDir = path.join(__dirname, '../src/locales');
const enFilePath = path.join(localesDir, 'en.json');

if (!fs.existsSync(enFilePath)) {
  console.error('Base locale en.json not found!');
  process.exit(1);
}

const enKeys = new Set(getKeys(JSON.parse(fs.readFileSync(enFilePath, 'utf-8'))));

// Get target language from CLI args, or default to all .json files except en.json
const targetLang = process.argv[2];
let filesToCheck = [];

if (targetLang) {
  const targetFile = `${targetLang}.json`;
  if (!fs.existsSync(path.join(localesDir, targetFile))) {
    console.error(`Locale file ${targetFile} not found!`);
    process.exit(1);
  }
  filesToCheck.push(targetFile);
} else {
  filesToCheck = fs.readdirSync(localesDir).filter(file => file.endsWith('.json') && file !== 'en.json');
}

let hasAnyErrors = false;

for (const file of filesToCheck) {
  const filePath = path.join(localesDir, file);
  const targetObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const targetKeys = new Set(getKeys(targetObj));

  let missing = 0;
  let extra = 0;

  for (const key of enKeys) {
    if (!targetKeys.has(key)) {
      console.error(`[${file}] Missing key: ${key}`);
      missing++;
    }
  }

  for (const key of targetKeys) {
    if (!enKeys.has(key)) {
      console.error(`[${file}] Extra key: ${key}`);
      extra++;
    }
  }

  if (missing === 0 && extra === 0) {
    console.log(`[${file}] Locale check passed. Perfectly matches en.json.`);
  } else {
    console.error(`[${file}] Locale check failed. Missing: ${missing}, Extra: ${extra}`);
    hasAnyErrors = true;
  }
}

if (hasAnyErrors) {
  process.exit(1);
} else {
  console.log('\nAll checked locales match perfectly!');
  process.exit(0);
}
