import React from 'react';
import { Metadata } from 'next';
import RashiClient, { rashiMetadata } from './RashiClient';

export async function generateMetadata({ params }: { params: { rashi: string } }): Promise<Metadata> {
    const rashiId = params.rashi.toLowerCase();
    const rashi = rashiMetadata[rashiId];
    
    if (!rashi) return { title: 'Horoscope | AstraNavi' };

    return {
        title: `${rashi.nameEn} Daily Horoscope | Vedic AstraNavi`,
        description: `Get your free daily Vedic horoscope for ${rashi.nameEn} (${rashi.nameHi}). Comprehensive insights into career, love, health, and finance.`,
    };
}

export default function RashiHoroscopePage({ params }: { params: { rashi: string } }) {
    return <RashiClient rashiId={params.rashi} />;
}
