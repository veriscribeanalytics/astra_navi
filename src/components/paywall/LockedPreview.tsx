'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePaywallContext } from '@/context/PaywallContext';

interface LockedPreviewCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface LockedPreviewProps {
  /**
   * Structural placeholder rendered BEHIND the lock (skeleton bars, an empty
   * chart axis, etc.). This shows the shape of what the user will get — it must
   * NOT contain real or fabricated data values. Dimmed and non-interactive.
   */
  children?: React.ReactNode;
  /** The "Unlock to ..." headline shown next to the lock. */
  message: string;
  /** Optional secondary line under the message. */
  subMessage?: string;
  /** Optional CTA buttons rendered under the message. */
  ctas?: LockedPreviewCta[];
  /** Accent color (defaults to the user's current tier color). */
  color?: string;
  /** Smaller padding/lock for tight overlay slots. */
  compact?: boolean;
  className?: string;
}

/**
 * LockedPreview — the paid-feature teaser used across the app.
 *
 * Renders a dimmed skeleton "structure" behind a centered dashed-circle lock and
 * an "Unlock to ..." message. It deliberately shows NO fake numbers and never
 * blurs real data — paid users get a skeleton then real data, free users get
 * this clean structural preview. See Image #1 reference design.
 */
export default function LockedPreview({
  children,
  message,
  subMessage,
  ctas,
  color,
  compact = false,
  className = '',
}: LockedPreviewProps) {
  const { tierColor } = usePaywallContext();
  const accent = color || tierColor;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${className}`}
      style={{ '--locked-accent': accent } as React.CSSProperties}
    >
      {/* Blurred structural preview behind the lock (dimmed, inert). */}
      {children && (
        <div className="pointer-events-none select-none opacity-45 blur-[3px]" aria-hidden="true">
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/20 px-4 text-center backdrop-blur-[1px]">
        <div
          className={`flex items-center justify-center rounded-full border-2 border-dashed border-[var(--locked-accent)]/60 bg-surface/75 text-[var(--locked-accent)] shadow-[0_0_24px_rgba(0,0,0,0.22)] ${
            compact ? 'h-12 w-12' : 'h-14 w-14'
          }`}
        >
          <Lock className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        </div>
        <div className="space-y-1">
          <p className={`font-bold text-foreground/80 leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
            {message}
          </p>
          {subMessage && (
            <p className="text-[11px] text-foreground/45 leading-relaxed max-w-[28ch] mx-auto">
              {subMessage}
            </p>
          )}
        </div>

        {ctas && ctas.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            {ctas.map((cta, i) => {
              const cls =
                'inline-flex items-center gap-1.5 rounded-xl border border-[var(--locked-accent)]/40 bg-[var(--locked-accent)]/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--locked-accent)] transition-all hover:bg-[var(--locked-accent)]/[0.16] hover:border-[var(--locked-accent)]/60 cursor-pointer';
              if (cta.href) {
                return (
                  <Link key={i} href={cta.href} className={cls}>
                    <Lock className="h-2.5 w-2.5" />
                    {cta.label}
                  </Link>
                );
              }
              return (
                <button key={i} type="button" onClick={cta.onClick} className={cls}>
                  <Lock className="h-2.5 w-2.5" />
                  {cta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** A plain shimmer bar for building LockedPreview skeleton structures. */
export function PreviewBar({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-skeleton-shimmer rounded-md bg-surface-variant/20 ${className}`} style={style} />;
}
