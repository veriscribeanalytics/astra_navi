import { Metadata } from 'next';
import RashiHoroscopeClient, { rashiMetadata } from './RashiHoroscopeClient';

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
