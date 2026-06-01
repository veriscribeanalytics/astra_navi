'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import { useChat } from '@/context/ChatContext';
import { getAvatarImage } from '@/utils/avatarStyle';

export default function AiAstrologerStrip() {
  const { t } = useTranslation();
  const { avatars } = useChat();

  const GUIDES = [
    'navi',
    'relationship_guide',
    'career_mentor',
    'spiritual_guide',
    'finance_mentor',
    'astro_sage'
  ] as const;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
          {t('newDashboard.aiAstrologer.title')}
        </span>
        <Link
          href="/chat"
          className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          {t('newDashboard.aiAstrologer.howItWorks')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Grid layout for even spacing */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 w-full">
        {GUIDES.map((guide) => {
          const catalogEntry = avatars.find(a => a.avatarId === guide);
          const img = getAvatarImage(guide, catalogEntry) || '/placeholder-avatar.png';
          const name = catalogEntry?.name || t(`newDashboard.aiAstrologer.guides.${guide}.name`);
          const title = catalogEntry?.title || t(`newDashboard.aiAstrologer.guides.${guide}.title`);

          return (
            <Link
              key={guide}
              href={`/chat?guide=${guide}`}
              className="w-full h-[136px] sm:h-[144px] flex flex-col items-center justify-between p-2 sm:p-2.5 border border-outline-variant/20 rounded-2xl bg-surface hover:border-secondary/30 transition-all text-center group shadow-sm"
            >
              {/* Avatar Image Frame */}
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-secondary/25 bg-surface-variant/30 shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.1)] group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="min-w-0 w-full flex-grow flex flex-col justify-center mt-1">
                <div className="font-headline font-bold text-foreground truncate w-full group-hover:text-secondary transition-colors text-[11px] sm:text-[12px] leading-tight">
                  {name}
                </div>
                <div className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-foreground/45 font-bold truncate w-full mt-0.5 leading-none">
                  {title}
                </div>
              </div>

              {/* Rating Row */}
              <div className="flex items-center gap-0.5 mt-1 shrink-0">
                <Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                <span className="text-[9px] font-bold text-foreground/40 leading-none">
                  4.9
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Full-width CTA */}
      <Link href="/chat" className="w-full block pt-1">
        <button className="w-full py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/25 transition-all shadow-sm flex items-center justify-center gap-1">
          {t('newDashboard.aiAstrologer.freeFirstQuestion')} <ChevronRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
