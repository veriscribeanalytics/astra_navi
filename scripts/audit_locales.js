// Comprehensive locale audit:
//   - Missing keys (in en.json but not in <locale>.json)
//   - Extra keys (in <locale>.json but not in en.json)
//   - Array length mismatches
//   - Placeholder integrity ({n}, {score}, {planet}, {label}, etc.)
//   - Verbatim English values (with brand/term allowlist)

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGET_LOCALES = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

const ALLOWLIST = new Set([
  'Navi', 'AI Navi', 'AstraNavi', 'Astra', 'Vedic AI', 'AI', 'Google',
  'JSON', 'TXT', 'PDF', 'API', 'URL', 'OK',
  '100%', '75+', '45–74', '< 45', '85%',
  'Pratipada', 'Siddha',
  // Sanskrit/Jyotish terms (commonly kept untranslated)
  'Jyotish', 'Kundli', 'Rashi', 'Nakshatra', 'Dasha', 'Mahadasha', 'Antardasha',
  'Lagna', 'Navamsha', 'Navamsa', 'BPHS', 'Guna Milan', 'Ashtakavarga',
  'Panchang', 'Tithi', 'Yoga', 'Karana', 'Muhurta', 'Varga', 'Graha', 'Bhava',
  'Ayanamsa', 'Lahiri', 'Mangal Dosha', 'Pratipada',
]);

function collectKeys(obj, prefix = '') {
  const out = {};
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      Object.assign(out, collectKeys(item, `${prefix}[${idx}]`));
    });
    out[`${prefix}::__length`] = obj.length;
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      Object.assign(out, collectKeys(v, next));
    }
    return out;
  }
  out[prefix] = obj;
  return out;
}

function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const m = str.match(/\{[a-zA-Z_]+\}/g);
  return m ? m.sort() : [];
}

function looksLikeEnglish(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (ALLOWLIST.has(trimmed)) return false;
  // If it contains any non-ASCII letter, it's likely translated
  if (/[-￿]/.test(trimmed)) return false;
  // If it's just digits/punctuation/symbols, skip
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  // Mixed-script values that contain English words alongside native script are OK (handled above)
  return true;
}

function readLocale(code) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const en = readLocale('en');
const enKeys = collectKeys(en);
const enKeyNames = Object.keys(enKeys);

let totalIssues = 0;
const report = {};

for (const code of TARGET_LOCALES) {
  const loc = readLocale(code);
  const locKeys = collectKeys(loc);
  const issues = {
    missing: [],
    extra: [],
    lengthMismatch: [],
    placeholderMismatch: [],
    verbatimEnglish: [],
  };

  // Missing & length mismatches
  for (const k of enKeyNames) {
    if (!(k in locKeys)) {
      if (k.endsWith('::__length')) {
        issues.lengthMismatch.push(`${k.replace('::__length', '')} (missing array)`);
      } else {
        issues.missing.push(k);
      }
      continue;
    }
    if (k.endsWith('::__length')) {
      if (enKeys[k] !== locKeys[k]) {
        issues.lengthMismatch.push(`${k.replace('::__length', '')}: en=${enKeys[k]} ${code}=${locKeys[k]}`);
      }
      continue;
    }
    // Placeholder check
    const enPH = extractPlaceholders(enKeys[k]);
    const lcPH = extractPlaceholders(locKeys[k]);
    if (JSON.stringify(enPH) !== JSON.stringify(lcPH)) {
      issues.placeholderMismatch.push(`${k}: en=${JSON.stringify(enPH)} ${code}=${JSON.stringify(lcPH)}`);
    }
    // Verbatim English check
    if (typeof locKeys[k] === 'string' && typeof enKeys[k] === 'string') {
      if (locKeys[k] === enKeys[k] && looksLikeEnglish(locKeys[k])) {
        issues.verbatimEnglish.push(`${k}: "${locKeys[k]}"`);
      }
    }
  }

  // Extra keys
  for (const k of Object.keys(locKeys)) {
    if (!(k in enKeys) && !k.endsWith('::__length')) {
      issues.extra.push(k);
    }
  }

  const count =
    issues.missing.length +
    issues.extra.length +
    issues.lengthMismatch.length +
    issues.placeholderMismatch.length +
    issues.verbatimEnglish.length;
  totalIssues += count;
  report[code] = { issues, count };
}

console.log(`=== en.json: ${enKeyNames.filter(k => !k.endsWith('::__length')).length} leaf keys ===\n`);

for (const code of TARGET_LOCALES) {
  const { issues, count } = report[code];
  console.log(`\n──── ${code}.json — ${count} issue${count === 1 ? '' : 's'} ────`);
  if (count === 0) {
    console.log('  ok');
    continue;
  }
  if (issues.missing.length) {
    console.log(`  MISSING (${issues.missing.length}):`);
    issues.missing.slice(0, 20).forEach(k => console.log(`    - ${k}`));
    if (issues.missing.length > 20) console.log(`    ... and ${issues.missing.length - 20} more`);
  }
  if (issues.extra.length) {
    console.log(`  EXTRA (${issues.extra.length}):`);
    issues.extra.slice(0, 20).forEach(k => console.log(`    + ${k}`));
    if (issues.extra.length > 20) console.log(`    ... and ${issues.extra.length - 20} more`);
  }
  if (issues.lengthMismatch.length) {
    console.log(`  LENGTH MISMATCH (${issues.lengthMismatch.length}):`);
    issues.lengthMismatch.forEach(m => console.log(`    ! ${m}`));
  }
  if (issues.placeholderMismatch.length) {
    console.log(`  PLACEHOLDER MISMATCH (${issues.placeholderMismatch.length}):`);
    issues.placeholderMismatch.slice(0, 10).forEach(m => console.log(`    ? ${m}`));
    if (issues.placeholderMismatch.length > 10) console.log(`    ... and ${issues.placeholderMismatch.length - 10} more`);
  }
  if (issues.verbatimEnglish.length) {
    console.log(`  VERBATIM ENGLISH (${issues.verbatimEnglish.length}):`);
    issues.verbatimEnglish.slice(0, 15).forEach(m => console.log(`    en ${m}`));
    if (issues.verbatimEnglish.length > 15) console.log(`    ... and ${issues.verbatimEnglish.length - 15} more`);
  }
}

console.log(`\n\nTOTAL ISSUES: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
