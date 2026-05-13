export const PLANET_GLYPHS: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mars': '♂', 'Mercury': '☿',
    'Jupiter': '♃', 'Venus': '♀', 'Saturn': '♄', 'Rahu': '☊', 'Ketu': '☋',
};

export const PLANET_COLORS: Record<string, string> = {
    'Sun': '#F59E0B', 'Moon': '#C7D2FE', 'Mars': '#EF4444',
    'Mercury': '#34D399', 'Jupiter': '#FBBF24', 'Venus': '#F472B6',
    'Saturn': '#818CF8', 'Rahu': '#9CA3AF', 'Ketu': '#A78BFA',
};

export const SIGN_TO_ICON: Record<string, string> = {
    'Aries': '/icons/rashi/aries.png', 'Taurus': '/icons/rashi/taurus.png',
    'Gemini': '/icons/rashi/gemini.png', 'Cancer': '/icons/rashi/cancer.png',
    'Leo': '/icons/rashi/leo.png', 'Virgo': '/icons/rashi/virgo.png',
    'Libra': '/icons/rashi/libra.png', 'Scorpio': '/icons/rashi/scorpio.png',
    'Sagittarius': '/icons/rashi/sagittarius.png', 'Capricorn': '/icons/rashi/capricorn.png',
    'Aquarius': '/icons/rashi/aquarius.png', 'Pisces': '/icons/rashi/pisces.png',
};

export const PLANET_TO_ICON: Record<string, string> = {
    'Sun': '/icons/planets/sun.png', 'Moon': '/icons/planets/moon.png',
    'Mars': '/icons/planets/mars.png', 'Saturn': '/icons/planets/saturn.png',
    'Mercury': '/icons/planets/mercury.png', 'Jupiter': '/icons/planets/jupiter.png',
    'Venus': '/icons/planets/venus.png',
};

/**
 * Normalize a localized planet name (Hindi, Sanskrit, transliterated, etc.)
 * to its canonical English key used by PLANET_TO_ICON, PLANET_COLORS, PLANET_GLYPHS.
 * Falls back to the raw input if no match is found.
 */
export function normalizePlanetName(name: string): string {
    if (!name) return name;
    const s = name.toLowerCase().trim();
    // Sun: सूर्य (Surya), सूरज (Suraj), Ravi
    if (s === 'sun' || s.includes('सूर्य') || s.includes('सूरज') || s.includes('surya') || s.includes('suraj') || s.includes('ravi')) return 'Sun';
    // Moon: चंद्रमा (Chandrama), चन्द्र (Chandra), सोम (Soma)
    if (s === 'moon' || s.includes('चंद्रमा') || s.includes('चन्द्र') || s.includes('chandra') || s.includes('chandrama') || s.includes('सोम') || s.includes('soma')) return 'Moon';
    // Mars: मंगल (Mangal), मङ्गल, Kuja
    if (s === 'mars' || s.includes('मंगल') || s.includes('मङ्गल') || s.includes('mangal') || s.includes('kuja')) return 'Mars';
    // Mercury: बुध (Budh)
    if (s === 'mercury' || s.includes('बुध') || s.includes('budh')) return 'Mercury';
    // Jupiter: गुरु (Guru), बृहस्पति (Brihaspati)
    if (s === 'jupiter' || s.includes('गुरु') || s.includes('बृहस्पति') || s.includes('brihaspati') || s.includes('guru')) return 'Jupiter';
    // Venus: शुक्र (Shukra)
    if (s === 'venus' || s.includes('शुक्र') || s.includes('shukra')) return 'Venus';
    // Saturn: शनि (Shani)
    if (s === 'saturn' || s.includes('शनि') || s.includes('shani')) return 'Saturn';
    // Rahu: राहु (Rahu)
    if (s === 'rahu' || s.includes('राहु')) return 'Rahu';
    // Ketu: केतु (Ketu)
    if (s === 'ketu' || s.includes('केतु')) return 'Ketu';
    // No match — return raw name as-is (might already be English)
    return name;
}

export const getDignityStyle = (dignity: string) => {
    if (dignity === 'Exalted') return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', label: 'Exalted', dot: 'bg-emerald-400' };
    if (dignity === 'Debilitated') return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Debilitated', dot: 'bg-red-400' };
    if (dignity === 'Swakshetra' || dignity === 'Own Sign') return { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', label: 'Swakshetra', dot: 'bg-blue-400' };
    if (dignity === 'Moolatrikona' || dignity === 'Great Friend') return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', label: 'Moolatrikona', dot: 'bg-amber-400' };
    if (dignity === 'Friendly' || dignity === 'Friend\'s Sign') return { text: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', label: 'Friendly', dot: 'bg-sky-400' };
    if (dignity === 'Enemy' || dignity === 'Inimical') return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', label: 'Enemy', dot: 'bg-orange-400' };
    return { text: 'text-foreground/40', bg: 'bg-foreground/5', border: 'border-foreground/10', label: 'Normal', dot: 'bg-foreground/20' };
};

export const getRashiData = (sign: string) => {
    if (!sign) return null;
    const s = sign.toLowerCase();
    if (s.includes('mesh') || s.includes('aries') || s.includes('मेष')) return { id: 'aries', name: 'Mesh', en: 'Aries', icon: '/icons/rashi/aries.png' };
    if (s.includes('vrish') || s.includes('taurus') || s.includes('वृषभ')) return { id: 'taurus', name: 'Vrish', en: 'Taurus', icon: '/icons/rashi/taurus.png' };
    if (s.includes('mithun') || s.includes('gemini') || s.includes('मिथुन')) return { id: 'gemini', name: 'Mithun', en: 'Gemini', icon: '/icons/rashi/gemini.png' };
    if (s.includes('kark') || s.includes('cancer') || s.includes('कर्क')) return { id: 'cancer', name: 'Kark', en: 'Cancer', icon: '/icons/rashi/cancer.png' };
    if (s.includes('simha') || s.includes('leo') || s.includes('सिंह')) return { id: 'leo', name: 'Simha', en: 'Leo', icon: '/icons/rashi/leo.png' };
    if (s.includes('kanya') || s.includes('virgo') || s.includes('कन्या')) return { id: 'virgo', name: 'Kanya', en: 'Virgo', icon: '/icons/rashi/virgo.png' };
    if (s.includes('tula') || s.includes('libra') || s.includes('तुला')) return { id: 'libra', name: 'Tula', en: 'Libra', icon: '/icons/rashi/libra.png' };
    if (s.includes('vrishchik') || s.includes('scorpio') || s.includes('वृश्चिक')) return { id: 'scorpio', name: 'Vrishchik', en: 'Scorpio', icon: '/icons/rashi/scorpio.png' };
    if (s.includes('dhanu') || s.includes('sagittarius') || s.includes('धनु')) return { id: 'sagittarius', name: 'Dhanu', en: 'Sagittarius', icon: '/icons/rashi/sagittarius.png' };
    if (s.includes('makar') || s.includes('capricorn') || s.includes('मकर')) return { id: 'capricorn', name: 'Makar', en: 'Capricorn', icon: '/icons/rashi/capricorn.png' };
    if (s.includes('kumbh') || s.includes('aquarius') || s.includes('कुम्भ') || s.includes('कुंभ')) return { id: 'aquarius', name: 'Kumbh', en: 'Aquarius', icon: '/icons/rashi/aquarius.png' };
    if (s.includes('meen') || s.includes('pisces') || s.includes('मीन')) return { id: 'pisces', name: 'Meen', en: 'Pisces', icon: '/icons/rashi/pisces.png' };
    return null;
};
