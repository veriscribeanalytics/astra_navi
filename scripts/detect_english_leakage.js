// Find English/Latin words inside non-English locale values.
// A Latin "word" is a run of 3+ ASCII letters. Each value gets a list of such words.
// We filter out an allowlist of brand names, Sanskrit terms, technical acronyms, and
// transliterated tech words that are legitimately kept in Latin script.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const TARGETS = ['hi', 'ta', 'te', 'kn', 'bn', 'mr', 'gu', 'ml', 'pa', 'ko'];

// Latin words that are OK to leave in any locale. Compared case-insensitively.
const ALLOW_LOWER = new Set([
  // Brands & product
  'navi', 'astramitra', 'astra', 'ai', 'bphs',
  'google', 'razorpay', 'app', 'store', 'play', 'apple', 'facebook',
  // Tech acronyms / file types
  'json', 'pdf', 'txt', 'api', 'url', 'ok', 'dst', 'utc', 'sms', 'otp',
  'gps', 'aes', 'nasa', 'twofa', 'auth', 'ssl', 'tls', 'crud',
  // Sanskrit / Jyotish terms commonly seen in Latin script
  'jyotish', 'kundli', 'kundali', 'rashi', 'nakshatra', 'dasha', 'mahadasha',
  'antardasha', 'bhukti', 'lagna', 'ascendant', 'bhava', 'tithi', 'yoga',
  'karana', 'muhurta', 'varga', 'graha', 'ayanamsa', 'lahiri', 'mangal',
  'dosha', 'navagraha', 'navamsha', 'navamsa', 'gana', 'yoni', 'nadi',
  'guna', 'milan', 'ashtakoot', 'ashtakuta', 'ashtakavarga', 'panchang',
  'moksha', 'dharma', 'artha', 'kama', 'pitr', 'mantra', 'vedic', 'veda',
  'puja', 'pooja', 'homa', 'havan', 'yagna', 'yajna', 'shanti',
  'raja', 'dhana', 'gajakesari', 'parivartana', 'neechabhanga', 'viparita',
  'kendra', 'trikona', 'dusthana', 'upachaya', 'shubha', 'paap', 'paapa',
  'purushartha', 'purvapunya', 'shastra', 'astrology',
  // Planet names (commonly kept in English in astrological text)
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu',
  // Zodiac signs
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra',
  'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  // Nakshatra names (commonly in Latin in astrology UIs)
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra',
  'punarvasu', 'pushya', 'ashlesha', 'magha', 'purva', 'phalguni',
  'uttara', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha',
  'mula', 'ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'bhadrapada',
  'revati',
  // Days/months/short labels
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  // Examples / form labels likely-OK
  'example', 'delhi',
  // Pricing brand names
  'seeker', 'devotee', 'disciple',
]);

function flatten(obj, prefix = '', out = []) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) { obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out)); return out; }
  if (typeof obj === 'object') { for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out); return out; }
  out.push([prefix, obj]);
  return out;
}

// Match runs of 3+ ASCII letters
const LATIN_WORD = /[A-Za-z]{3,}/g;

// Strip placeholders ({...}), URLs, emails, hex/dotted version numbers,
// numbers with units (256, 36-pt, etc.) before scanning for Latin words.
function stripNoise(s) {
  return s
    .replace(/\{[^}]*\}/g, ' ')           // placeholders
    .replace(/https?:\/\/\S+/g, ' ')      // URLs
    .replace(/\b[\w.+-]+@[\w.-]+\b/g, ' ')// emails
    .replace(/\bAES-?\d+\b/gi, ' ')       // crypto specs
    .replace(/\b[A-Z]{2,5}-?\d+\b/g, ' ');// abbrevs like AES-256
}

let totalIssues = 0;
for (const code of TARGETS) {
  const loc = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), 'utf8'));
  const entries = flatten(loc);
  const issues = [];
  for (const [key, value] of entries) {
    if (typeof value !== 'string') continue;
    const cleaned = stripNoise(value);
    const words = cleaned.match(LATIN_WORD);
    if (!words) continue;
    const suspicious = [];
    for (const w of words) {
      if (!ALLOW_LOWER.has(w.toLowerCase())) suspicious.push(w);
    }
    if (suspicious.length) {
      issues.push({ key, value, words: [...new Set(suspicious)] });
    }
  }
  if (issues.length) {
    console.log(`\n──── ${code}.json (${issues.length} entries with Latin words) ────`);
    issues.slice(0, 30).forEach(i => {
      const preview = i.value.length > 100 ? i.value.slice(0, 100) + '...' : i.value;
      console.log(`  ${i.key}`);
      console.log(`    words: ${i.words.join(', ')}`);
      console.log(`    value: ${JSON.stringify(preview)}`);
    });
    if (issues.length > 30) console.log(`    ... and ${issues.length - 30} more`);
    totalIssues += issues.length;
  } else {
    console.log(`${code}.json: clean`);
  }
}

console.log(`\nTotal entries with non-allowlisted Latin words: ${totalIssues}`);
