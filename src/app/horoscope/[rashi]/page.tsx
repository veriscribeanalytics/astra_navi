import { Metadata } from 'next';
import RashiHoroscopeClient from './RashiHoroscopeClient';

// Rashi metadata for SEO
const rashiMetadata: Record<string, { nameEn: string; nameHi: string }> = {
    aries: { nameEn: 'Aries', nameHi: 'मेष' },
    taurus: { nameEn: 'Taurus', nameHi: 'वृषभ' },
    gemini: { nameEn: 'Gemini', nameHi: 'मिथुन' },
    cancer: { nameEn: 'Cancer', nameHi: 'कर्क' },
    leo: { nameEn: 'Leo', nameHi: 'सिंह' },
    virgo: { nameEn: 'Virgo', nameHi: 'कन्या' },
    libra: { nameEn: 'Libra', nameHi: 'तुला' },
    scorpio: { nameEn: 'Scorpio', nameHi: 'वृश्चिक' },
    sagittarius: { nameEn: 'Sagittarius', nameHi: 'धनु' },
    capricorn: { nameEn: 'Capricorn', nameHi: 'मकर' },
    aquarius: { nameEn: 'Aquarius', nameHi: 'कुम्भ' },
    pisces: { nameEn: 'Pisces', nameHi: 'मीन' }
};

export async function generateMetadata({ params }: { params: { rashi: string } }): Promise<Metadata> {
    const rashiId = params.rashi.toLowerCase();
    const rashi = rashiMetadata[rashiId];
    
    if (!rashi) return { title: 'Horoscope | AstraNavi' };

    return {
        title: `${rashi.nameEn} Daily Horoscope | Vedic AstraNavi`,
        description: `Get your free daily Vedic horoscope for ${rashi.nameEn} (${rashi.nameHi}). Comprehensive insights into career, love, health, and finance.`,
    };
}

export default function Page() {
    return <RashiHoroscopeClient />;
}
