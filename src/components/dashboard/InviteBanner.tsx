'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ChevronRight } from 'lucide-react';
import { useIncomingInvites, useTranslation } from '@/hooks';

/**
 * Renders a subtle banner above the dashboard family strip when the user has
 * pending incoming invites. Tap routes to the dedicated invites page.
 * Renders null while loading or when there are no invites.
 */
const InviteBanner: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useIncomingInvites();

  if (!data || data.length === 0) return null;

  const count = data.length;
  const copy = count === 1
    ? t('dashboard.familyInviteBanner', { count })
    : t('dashboard.familyInviteBannerPlural', { count });

  return (
    <Link
      href="/family/invites"
      className="group mt-8 sm:mt-12 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/15 transition-colors"
      aria-label={copy}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4" />
        </div>
        <p className="text-[13px] sm:text-sm font-semibold text-amber-200 truncate">
          {copy}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-widest shrink-0">
        {t('dashboard.familyInviteReview')}
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
};

export default InviteBanner;
