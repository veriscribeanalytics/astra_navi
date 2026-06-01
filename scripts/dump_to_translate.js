const fs = require('fs');
const path = require('path');

const analysis = JSON.parse(fs.readFileSync('src/locales/bn_analysis.json', 'utf8'));

const out = {};
for (const item of analysis.missing) {
  out[item.key] = item.enVal;
}
for (const item of analysis.untranslated) {
  out[item.key] = item.enVal;
}

fs.writeFileSync('src/locales/to_translate.json', JSON.stringify(out, null, 2), 'utf8');
console.log('Saved to src/locales/to_translate.json');
console.log('Total keys to translate:', Object.keys(out).length);
