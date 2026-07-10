'use client';

import React from 'react';

type Block = { type: 'para' | 'list'; items: string[] };
type ParsedSection = { number: string; key: string; title: string; blocks: Block[] };

const SECTION_META: { key: string; title: string }[] = [
  { key: 'direct_response', title: 'Direct Response' },
  { key: 'chart_analysis', title: 'Chart Analysis' },
  { key: 'timing_n_probability', title: 'Timing & Probability' },
  { key: 'practical_next_steps', title: 'Practical Next Steps' },
];

function titleForKey(key: string): string {
  const meta = SECTION_META.find((s) => s.key === key);
  if (meta) return meta.title;
  return key
    .replace(/_n_/g, ' & ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const BULLET_RE = /^[-•*\u2022]\s+/;

function parseBodyBlocks(body: string, isBulletSection: boolean): Block[] {
  if (!body) return [];

  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => BULLET_RE.test(l));

  // Case 1: newline-separated bullet points
  if (bulletLines.length >= 2) {
    return [{ type: 'list', items: bulletLines.map((l) => l.replace(BULLET_RE, '').trim()) }];
  }

  // Case 2: bullet section whose points are inline (e.g. "- a - b - c")
  if (isBulletSection) {
    const parts = body
      .split(/\s+-\s+/)
      .map((s) => s.replace(BULLET_RE, '').trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return [{ type: 'list', items: parts }];
    }
  }

  // Case 3: regular paragraphs (split on blank lines, collapse internal newlines)
  const paras = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (paras.length === 0 && body.trim()) {
    return [{ type: 'para', items: [body.trim()] }];
  }
  return paras.map((p) => ({ type: 'para' as const, items: [p] }));
}

function parseReading(text: string): { intro: string; sections: ParsedSection[] } {
  const keys = SECTION_META.map((s) => s.key).join('|');
  const markerRegex = new RegExp(`#(\\d+)\\s+(${keys})\\s*:?`, 'g');
  const matches = [...text.matchAll(markerRegex)];

  if (matches.length === 0) {
    const trimmed = text.trim();
    return trimmed ? { intro: trimmed, sections: [] } : { intro: '', sections: [] };
  }

  const firstIdx = matches[0].index ?? 0;
  const intro = text.slice(0, firstIdx).trim();

  const sections: ParsedSection[] = matches.map((match, i) => {
    const number = match[1];
    const key = match[2];
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const body = text.slice(start, end).trim();
    const isBullet = key === 'practical_next_steps';
    return { number, key, title: titleForKey(key), blocks: parseBodyBlocks(body, isBullet) };
  });

  return { intro, sections };
}

const ReadingContent: React.FC<{ text: string; isReading: boolean }> = ({ text, isReading }) => {
  const { intro, sections } = parseReading(text);

  const lastSectionIdx = sections.length - 1;

  return (
    <div className="space-y-8">
      {intro && (
        <p className="text-ui-lead leading-relaxed text-body font-serif">{intro}</p>
      )}

      {sections.map((section, si) => {
        const isLastSection = si === lastSectionIdx;
        return (
          <section key={si} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full border border-secondary/40 bg-secondary/10 text-secondary text-ui-small font-bold font-headline shadow-[0_0_15px_var(--glow-color)]">
                {section.number.padStart(2, '0')}
              </span>
              <h4 className="font-headline text-ui-body md:text-ui-lead text-secondary font-bold uppercase tracking-[0.15em]">
                {section.title}
              </h4>
              <span className="flex-1 h-px bg-gradient-to-r from-secondary/40 to-transparent" />
            </div>

            <div className="ml-1 pl-4 border-l border-secondary/15 space-y-4">
              {section.blocks.map((block, bi) => {
                const isLastBlock = bi === section.blocks.length - 1;

                if (block.type === 'list') {
                  return (
                    <ul key={bi} className="space-y-3">
                      {block.items.map((item, ii) => {
                        const isLastItem = isLastSection && isLastBlock && ii === block.items.length - 1;
                        return (
                          <li
                            key={ii}
                            className={`flex gap-3 items-start text-ui-body md:text-ui-lead leading-relaxed font-serif text-body animate-in fade-in slide-in-from-bottom-3 duration-500 ${isReading && isLastItem ? 'animate-shimmer' : ''}`}
                          >
                            <span className="text-secondary mt-1 shrink-0 text-sm">✦</span>
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                return block.items.map((para, ii) => {
                  const isLastItem = isLastSection && isLastBlock && ii === block.items.length - 1;
                  return (
                    <p
                      key={`${bi}-${ii}`}
                      className={`text-ui-body md:text-ui-lead leading-relaxed font-serif text-body animate-in fade-in slide-in-from-bottom-3 duration-500 ${isReading && isLastItem ? 'animate-shimmer' : ''}`}
                    >
                      {para}
                    </p>
                  );
                });
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ReadingContent;
