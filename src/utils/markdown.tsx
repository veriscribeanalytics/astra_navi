'use client';

import React from 'react';

/**
 * Minimal, dependency-free markdown renderer for a small, trusted subset used
 * by backend-generated summary blocks (e.g. the `/api/match` `summary` and
 * `ai_narrative` fields):
 *   - `## Heading 2`
 *   - `### Heading 3`
 *   - `- list item` (with `**bold**` inline)
 *   - blank line as a separator
 *   - plain paragraph text (with `**bold**` and `*italic*` inline)
 *
 * It intentionally does NOT emit raw HTML or support arbitrary markdown —
 * content is parsed into React nodes, so there is no injection surface even
 * though the source is our own backend. For anything richer, install a real
 * renderer; this exists to avoid adding a markdown dependency for one field.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Tokenize **bold** and *italic* in a single pass.
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            nodes.push(text.slice(last, match.index));
        }
        if (match[2] !== undefined) {
            nodes.push(<strong key={`${keyBase}-b${i}`} className="font-bold text-foreground">{match[2]}</strong>);
        } else if (match[3] !== undefined) {
            nodes.push(<em key={`${keyBase}-i${i}`} className="italic">{match[3]}</em>);
        }
        last = match.index + match[0].length;
        i += 1;
    }
    if (last < text.length) {
        nodes.push(text.slice(last));
    }
    return nodes;
}

type Block =
    | { kind: 'h2'; text: string }
    | { kind: 'h3'; text: string }
    | { kind: 'li'; items: string[] }
    | { kind: 'p'; text: string };

function parseBlocks(md: string): Block[] {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let listAccum: string[] | null = null;

    const flushList = () => {
        if (listAccum && listAccum.length) {
            blocks.push({ kind: 'li', items: listAccum });
        }
        listAccum = null;
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) {
            flushList();
            continue;
        }
        if (line.startsWith('### ')) {
            flushList();
            blocks.push({ kind: 'h3', text: line.slice(4).trim() });
        } else if (line.startsWith('## ')) {
            flushList();
            blocks.push({ kind: 'h2', text: line.slice(3).trim() });
        } else if (line.startsWith('# ')) {
            flushList();
            blocks.push({ kind: 'h2', text: line.slice(2).trim() });
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!listAccum) listAccum = [];
            listAccum.push(line.slice(2).trim());
        } else {
            flushList();
            blocks.push({ kind: 'p', text: line.trim() });
        }
    }
    flushList();
    return blocks;
}

export function MarkdownText({
    content,
    className = '',
    h2Class = 'text-lg font-headline font-bold text-foreground mt-5 first:mt-0',
    h3Class = 'text-sm font-bold uppercase tracking-wider text-foreground/70 mt-4 mb-1.5',
    pClass = 'text-[14px] leading-relaxed text-foreground/70',
    ulClass = 'space-y-1.5 my-2',
    liClass = 'text-[14px] leading-relaxed text-foreground/70 flex gap-2',
}: {
    content: string;
    className?: string;
    h2Class?: string;
    h3Class?: string;
    pClass?: string;
    ulClass?: string;
    liClass?: string;
}) {
    if (!content || !content.trim()) return null;
    const blocks = parseBlocks(content);

    return (
        <div className={className}>
            {blocks.map((block, idx) => {
                if (block.kind === 'h2') {
                    return <h2 key={idx} className={h2Class}>{renderInline(block.text, `h2-${idx}`)}</h2>;
                }
                if (block.kind === 'h3') {
                    return <h3 key={idx} className={h3Class}>{renderInline(block.text, `h3-${idx}`)}</h3>;
                }
                if (block.kind === 'p') {
                    return <p key={idx} className={pClass}>{renderInline(block.text, `p-${idx}`)}</p>;
                }
                // list
                return (
                    <ul key={idx} className={ulClass}>
                        {block.items.map((item, j) => (
                            <li key={j} className={liClass}>
                                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/60" />
                                <span className="flex-1">{renderInline(item, `li-${idx}-${j}`)}</span>
                            </li>
                        ))}
                    </ul>
                );
            })}
        </div>
    );
}
