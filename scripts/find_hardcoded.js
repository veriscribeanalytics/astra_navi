// Scan all component .tsx files for hardcoded English in placeholder/aria-label/title/JSX text
const fs = require('fs');
const path = require('path');

const dirs = [
  'src/components/chat',
  'src/components/auth',
  'src/components/match',
  'src/components/forecast',
  'src/components/home',
  'src/components/dashboard',
  'src/app/profile',
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const files = dirs.flatMap(d => walk(d));
const PATTERNS = [
  { name: 'placeholder', re: /placeholder="([A-Z][^"]*)"/g },
  { name: 'aria-label',  re: /aria-label="([^"]*)"/g },
  { name: 'title=str',   re: /title="([A-Z][^"]*)"/g },
  { name: 'JSX text',    re: />([A-Z][A-Za-z][A-Za-z][a-zA-Z ,.\-?!']+)</g },
];

const ALLOW = new Set([
  'Navi', 'AI', 'AI Navi', 'Astra', 'Astra Seeker', 'Devotee', 'Disciple',
  'Sanskrit', 'TXT', 'JSON', 'PDF', 'API', 'URL', 'OK',
  // Sanskrit / Jyotish proper nouns (kept in English transliteration intentionally)
  'Jyotish', 'Kundli', 'Nakshatra', 'Dasha', 'Mahadasha', 'Lagna', 'Rashi',
  'Panchang', 'Tithi', 'Yoga', 'Karana', 'Muhurta', 'Varga', 'Graha', 'Bhava',
  'Ayanamsa', 'Lahiri', 'Pratipada', 'Siddha', 'Revati', 'Gunas',
  // Planet/sign English names that may appear as sample/demo data
  'Mars', 'Mercury', 'Saturn', 'Sun', 'Moon', 'Venus', 'Jupiter',
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]);

let total = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const hits = [];
  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const txt = m[1].trim();
      if (ALLOW.has(txt)) continue;
      if (/^[A-Z]+$/.test(txt) && txt.length <= 3) continue;
      const before = src.slice(0, m.index);
      const ln = before.split('\n').length;
      hits.push({ ln, name, txt });
    }
  }
  if (hits.length) {
    console.log('=== ' + f + ' ===');
    hits.forEach(h => console.log('  L' + h.ln + ' [' + h.name + ']: ' + h.txt));
    total += hits.length;
  }
}
console.log('--- ' + total + ' hardcoded English strings remaining ---');
