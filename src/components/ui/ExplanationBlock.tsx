'use client';

import React from 'react';
import {
  Info,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import type { AreaExplanation } from '@/types/horoscope';

interface ExplanationSection {
  key: 'why' | 'positives' | 'challenges' | 'precautions' | 'recommendations' | 'summary';
  icon: LucideIcon;
  /** Tailwind classes + inline accent for the section header chip. */
  accent: 'info' | 'positive' | 'challenge' | 'caution' | 'primary' | 'summary';
}

const SECTIONS: ExplanationSection[] = [
  { key: 'why', icon: Info, accent: 'info' },
  { key: 'positives', icon: TrendingUp, accent: 'positive' },
  { key: 'challenges', icon: AlertTriangle, accent: 'challenge' },
  { key: 'precautions', icon: ShieldAlert, accent: 'caution' },
  { key: 'recommendations', icon: Lightbulb, accent: 'primary' },
  { key: 'summary', icon: Check, accent: 'summary' },
];

const ACCENT_STYLES: Record<ExplanationSection['accent'], { color: string; bg: string; border: string }> = {
  info: { color: '#7AA7FF', bg: 'rgba(122,167,255,0.08)', border: 'rgba(122,167,255,0.22)' },
  positive: { color: '#35CFA0', bg: 'rgba(53,207,160,0.08)', border: 'rgba(53,207,160,0.22)' },
  challenge: { color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.22)' },
  caution: { color: '#E16272', bg: 'rgba(225,98,114,0.08)', border: 'rgba(225,98,114,0.22)' },
  primary: { color: '#C9972E', bg: 'rgba(201,151,46,0.08)', border: 'rgba(201,151,46,0.24)' },
  summary: { color: '#2FD3A0', bg: 'rgba(47,211,160,0.08)', border: 'rgba(47,211,160,0.22)' },
};

function hasList(items: unknown): items is string[] {
  return Array.isArray(items) && items.some((i) => typeof i === 'string' && i.trim().length > 0);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Renders a per-life-area / per-day rating explanation as discrete labeled
 *  sections (Why / Positives / Challenges / Precautions / Recommendations /
 *  Summary). Returns null when the explanation is missing or entirely empty,
 *  so it is safe to drop into any layout without a surrounding guard. */
export default function ExplanationBlock({
  explanation,
  colorHex,
  className = '',
}: {
  explanation?: AreaExplanation | null;
  colorHex?: string;
  className?: string;
}) {
  const { t } = useTranslation();

  if (!explanation) return null;

  const primary = colorHex || '#C9972E';

  const labelFor = (key: ExplanationSection['key']) => {
    const fallbackLabels: Record<ExplanationSection['key'], string> = {
      why: 'Why',
      positives: 'Positives',
      challenges: 'Challenges',
      precautions: 'Precautions',
      recommendations: 'Recommendations',
      summary: 'Summary',
    };
    const translated = t(`horoscope.explanation.${key}`);
    return translated && translated !== `horoscope.explanation.${key}`
      ? translated
      : fallbackLabels[key];
  };

  const renderList = (items: string[] | undefined, accent: ExplanationSection['accent']) => {
    const list = (items || []).filter((i): i is string => hasText(i));
    if (list.length === 0) return null;
    const style = ACCENT_STYLES[accent];
    return (
      <ul className="mt-2 space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground/85">
            <span
              aria-hidden="true"
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: style.color }}
            />
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const rendered = SECTIONS.map((section) => {
    const value = explanation[section.key];
    const style = ACCENT_STYLES[section.accent];
    const Icon = section.icon;
    const accentColor = section.accent === 'primary' ? primary : style.color;

    if (section.key === 'why' || section.key === 'summary') {
      if (!hasText(value)) return null;
      if (section.key === 'why') {
        return (
          <div key={section.key}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: style.color }} />
              <h5
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: style.color }}
              >
                {labelFor(section.key)}
              </h5>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/85">{value}</p>
          </div>
        );
      }
      // summary — emphasized one-line verdict
      return (
        <div
          key={section.key}
          className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
          style={{ backgroundColor: style.bg, borderColor: style.border }}
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: style.color }} />
          <div>
            <h5
              className="text-[10px] font-black uppercase tracking-[0.16em] mb-0.5"
              style={{ color: style.color }}
            >
              {labelFor(section.key)}
            </h5>
            <p className="text-[13px] font-semibold leading-relaxed text-foreground/90">{value}</p>
          </div>
        </div>
      );
    }

    // list-based sections
    if (!hasList(value)) return null;
    return (
      <div key={section.key}>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
          <h5
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: accentColor }}
          >
            {labelFor(section.key)}
          </h5>
        </div>
        <div
          className="rounded-xl border px-3.5 py-3"
          style={{ backgroundColor: style.bg, borderColor: style.border }}
        >
          {renderList(value, section.accent)}
        </div>
      </div>
    );
  }).filter(Boolean);

  if (rendered.length === 0) return null;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {rendered}
    </div>
  );
}
