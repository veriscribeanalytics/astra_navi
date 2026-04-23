'use client';

import React from 'react';
import Image from 'next/image';

interface PersonCardProps {
  name: string;
  rashi?: string;
  rashiEn?: string;
  nakshatra?: string;
  pada?: number | string;
  gender?: 'male' | 'female';
}

const getRashiIcon = (sign: string) => {
  if (!sign) return null;
  const s = sign.toLowerCase().trim();
  if (s.includes('mesh') || s.includes('aries')) return '/icons/rashi/aries.png';
  if (s.includes('vrish') || s.includes('taurus')) return '/icons/rashi/taurus.png';
  if (s.includes('mithun') || s.includes('gemini')) return '/icons/rashi/gemini.png';
  if (s.includes('kark') || s.includes('cancer')) return '/icons/rashi/cancer.png';
  if (s.includes('simha') || s.includes('leo')) return '/icons/rashi/leo.png';
  if (s.includes('kanya') || s.includes('virgo')) return '/icons/rashi/virgo.png';
  if (s.includes('tula') || s.includes('libra')) return '/icons/rashi/libra.png';
  if (s.includes('vrishchik') || s.includes('scorpio')) return '/icons/rashi/scorpio.png';
  if (s.includes('dhanu') || s.includes('sagittarius')) return '/icons/rashi/sagittarius.png';
  if (s.includes('makar') || s.includes('capricorn')) return '/icons/rashi/capricorn.png';
  if (s.includes('kumbh') || s.includes('aquarius')) return '/icons/rashi/aquarius.png';
  if (s.includes('meen') || s.includes('pisces')) return '/icons/rashi/pisces.png';
  return null;
};

export default function PersonCard({ name, rashi, rashiEn, nakshatra, pada, gender }: PersonCardProps) {
  const icon = getRashiIcon(rashiEn || rashi || '');
  const displaySign = rashiEn || rashi || 'Unknown Sign';
  const displayNakshatra = nakshatra || 'Unknown';
  const displayPada = pada !== undefined && pada !== null ? `P-${pada}` : 'P-?';

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-outline-variant/10">
      <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 relative shrink-0">
        {icon ? (
          <Image src={icon} alt={displaySign} width={36} height={36} className="object-contain" />
        ) : (
          <span className="text-xl font-bold text-secondary">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold ${
          gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
        }`}>
          {gender === 'female' ? '♀' : '♂'}
        </div>
      </div>
      
      <div className="min-w-0">
        <h4 className="text-sm font-headline font-bold text-foreground truncate">{name}</h4>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
            {displaySign}
          </span>
          <span className="text-[10px] text-foreground/30">•</span>
          <span className="text-[10px] font-medium text-foreground/60">
            {displayNakshatra} ({displayPada})
          </span>
        </div>
      </div>
    </div>
  );
}
