// Apply surgical fixes for 27 script-mixing issues across 6 locales.
// Each fix replaces the broken value with a correctly-scripted one.
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

function setDeepPath(obj, dottedPath, value) {
  const tokens = [];
  let buf = '';
  for (let i = 0; i < dottedPath.length; i++) {
    const ch = dottedPath[i];
    if (ch === '.') { if (buf) { tokens.push(buf); buf = ''; } }
    else if (ch === '[') {
      if (buf) { tokens.push(buf); buf = ''; }
      const end = dottedPath.indexOf(']', i);
      tokens.push(parseInt(dottedPath.slice(i + 1, end), 10));
      i = end;
    } else buf += ch;
  }
  if (buf) tokens.push(buf);
  let node = obj;
  for (let i = 0; i < tokens.length - 1; i++) node = node[tokens[i]];
  node[tokens[tokens.length - 1]] = value;
}

// [locale, dotted-path, corrected value]
const fixes = [
  // Punjabi
  ['pa', 'plans.year', 'ਸਾਲ'],
  ['pa', 'blogs.houses.upachaya', 'ਉਪਚਯ ਭਾਵ'],

  // Gujarati
  ['gu', 'chat.feedback.tags[4][5]', 'અન્ય'],
  ['gu', 'blogs.index.ctaDescription', 'આપણું સ્વર્ગીય પુસ્તકાલય દર સપ્તાહે વધી રહ્યું છે. જો તમને તમારા ચાર્ટ વિશે કોઈ ચોક્કસ પ્રશ્ન હોય, તો Navi પાસે હવે તમારા માટે જવાબો તૈયાર છે.'],
  ['gu', 'blogs.yogas.dhanaDesc', 'સંપૂર્ણ સંપત્તિ માટેના સંયોજનો. જ્યારે કમાણીના (2જા) અને લાભના (11મા) ભાવ ભાગ્યના (5મા, 9મા) ભાવો સાથે ઊંડાણથી જોડાય છે, ત્યારે જાતકને અપાર નાણાકીય સમૃદ્ધિ મળે છે.'],

  // Tamil
  ['ta', 'landing.hero.askNavi', 'Navi-யிடம் கேளுங்கள்...'],
  ['ta', 'blogs.index.inProduction', 'உற்பத்தியில்'],
  ['ta', 'blogs.houses.trikona', 'த்ரிகோண (முக்கோண) வீடுகள்'],
  ['ta', 'blogs.planets.avasthas', 'அவஸ்தைகள் (கிரக நிலைகள்)'],
  ['ta', 'blogs.planets.planetaryGovernance', 'கிரக நிர்ணயம்'],
  ['ta', 'blogs.planets.mooltrikona', 'மூல த்ரிகோணம்'],
  ['ta', 'blogs.yogas.title', 'கிரக'],
  ['ta', 'blogs.yogas.activationPathDesc', 'முதன்மையாக ஈடுபட்ட கிரகங்களின் முக்கிய தசை / புக்தி காலங்களில் தூண்டப்படுகிறது.'],
  ['ta', 'blogs.remedies.target', 'இலக்கு'],
  ['ta', 'profile.page.errors.noEmailSession', 'அமர்வில் மின்னஞ்சல் கண்டுபிடிக்கப்படவில்லை. தயவுசெய்து வெளியேறி மீண்டும் உள்நுழையவும்.'],
  ['ta', 'profile.security.dangerZoneTitle', 'ஆபத்து மண்டலம்'],

  // Telugu
  ['te', 'dashboard.guidedConsultingDesc', 'కెరీర్, వివాహం మరియు జీవిత నిర్ణయాల కోసం నిర్మాణాత్మక సలహా.'],
  ['te', 'horoscope.detailedForecast', 'వివరణాత్మక అంచనా'],
  ['te', 'horoscope.detailedInsight', 'వివరణాత్మక అంతర్దృష్టి'],
  ['te', 'chat.avatarQuestions.relationship_guide[2]', 'నా సంబంధాలలో ఏ నమూనాలు పదేపదే కనిపిస్తున్నాయి?'],
  ['te', 'chat.feedback.tagSectionLabels[4]', 'ఏ చిన్న విషయం మిస్ అయింది?'],
  ['te', 'blogs.planets.functionalDesc', 'సహజ లక్షణాలకు మించి, గ్రహం మీ నిర్దిష్ట ఆరోహణ (లగ్నం) ఆధారంగా స్నేహితుడిగా లేదా శత్రువుగా పనిచేస్తుంది. మేషం లగ్నానికి కష్టం తెచ్చే అదే శని వృషభ లగ్నానికి సర్వోత్తమ శ్రేయోభిలాషిగా పనిచేస్తుంది.'],
  ['te', 'profile.security.sessionManagementDescription', 'మీ ఖాతాకు ప్రస్తుతం సైన్ ఇన్ చేసిన ఇతర అన్ని పరికరాల నుండి లాగ్‌అవుట్ చేయండి. ఈ పరికరం యాక్టివ్‌గా ఉంటుంది.'],

  // Kannada
  ['kn', 'common.login', 'ಲಾಗಿನ್'],
  ['kn', 'common.logout', 'ಲಾಗ್‌ಔಟ್'],
  ['kn', 'landing.slides[0].stat1l', 'ಉಚಿತ ಕುಂಡಲಿ'],

  // Malayalam
  ['ml', 'blogs.nakshatras.karmicDeepDive', 'കർമ്മ ആഴത്തിലുള്ള വിശകലനം'],
];

const byLocale = {};
for (const [loc, key, val] of fixes) {
  (byLocale[loc] = byLocale[loc] || []).push([key, val]);
}

for (const [loc, items] of Object.entries(byLocale)) {
  const file = path.join(LOCALES_DIR, `${loc}.json`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [key, val] of items) {
    setDeepPath(j, key, val);
    console.log(`  ${loc}.${key} -> ${JSON.stringify(val).slice(0, 60)}${val.length > 60 ? '...' : ''}`);
  }
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n');
  console.log(`${loc}.json: ${items.length} fixes written`);
}

console.log(`\n${fixes.length} fixes applied across ${Object.keys(byLocale).length} locales`);
