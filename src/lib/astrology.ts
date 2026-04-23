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

export const getDignityStyle = (dignity: string) => {
    if (dignity === 'Exalted') return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', label: 'Exalted', dot: 'bg-emerald-400' };
    if (dignity === 'Debilitated') return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Debilitated', dot: 'bg-red-400' };
    return { text: 'text-foreground/40', bg: 'bg-foreground/5', border: 'border-foreground/10', label: 'Normal', dot: 'bg-foreground/20' };
};

export const getRashiData = (sign: string) => {
    if (!sign) return null;
    const s = sign.toLowerCase();
    if (s.includes('mesh') || s.includes('aries')) return { id: 'aries', name: 'Mesh', en: 'Aries', icon: '/icons/rashi/aries.png' };
    if (s.includes('vrish') || s.includes('taurus')) return { id: 'taurus', name: 'Vrish', en: 'Taurus', icon: '/icons/rashi/taurus.png' };
    if (s.includes('mithun') || s.includes('gemini')) return { id: 'gemini', name: 'Mithun', en: 'Gemini', icon: '/icons/rashi/gemini.png' };
    if (s.includes('kark') || s.includes('cancer')) return { id: 'cancer', name: 'Kark', en: 'Cancer', icon: '/icons/rashi/cancer.png' };
    if (s.includes('simha') || s.includes('leo')) return { id: 'leo', name: 'Simha', en: 'Leo', icon: '/icons/rashi/leo.png' };
    if (s.includes('kanya') || s.includes('virgo')) return { id: 'virgo', name: 'Kanya', en: 'Virgo', icon: '/icons/rashi/virgo.png' };
    if (s.includes('tula') || s.includes('libra')) return { id: 'libra', name: 'Tula', en: 'Libra', icon: '/icons/rashi/libra.png' };
    if (s.includes('vrishchik') || s.includes('scorpio')) return { id: 'scorpio', name: 'Vrishchik', en: 'Scorpio', icon: '/icons/rashi/scorpio.png' };
    if (s.includes('dhanu') || s.includes('sagittarius')) return { id: 'sagittarius', name: 'Dhanu', en: 'Sagittarius', icon: '/icons/rashi/sagittarius.png' };
    if (s.includes('makar') || s.includes('capricorn')) return { id: 'capricorn', name: 'Makar', en: 'Capricorn', icon: '/icons/rashi/capricorn.png' };
    if (s.includes('kumbh') || s.includes('aquarius')) return { id: 'aquarius', name: 'Kumbh', en: 'Aquarius', icon: '/icons/rashi/aquarius.png' };
    if (s.includes('meen') || s.includes('pisces')) return { id: 'pisces', name: 'Meen', en: 'Pisces', icon: '/icons/rashi/pisces.png' };
    return null;
};
