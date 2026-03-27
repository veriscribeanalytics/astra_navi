'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ChatBubble from '@/components/ui/ChatBubble';

/* ---------- Types ---------- */
interface InsightItem {
  label: string;
  value: string;
}

interface DashaRow {
  planet: string;
  fill: string;
  fillColor?: string;
  dates: string;
  active?: boolean;
}

interface AiMessage {
  type: 'ai';
  text: string;
  insights?: InsightItem[];
  dasha?: { title: string; rows: DashaRow[] };
}

interface UserMessage {
  type: 'user';
  text: string;
}

interface SystemMessage {
  type: 'system';
  text: string;
}

type ChatMessage = AiMessage | UserMessage | SystemMessage;

/* ---------- Demo Messages ---------- */
const demoMessages: ChatMessage[] = [
  {
    type: 'system',
    text: 'Session started · Reading your chart · Vrishchika Lagna · Saturn Mahadasha',
  },
  {
    type: 'ai',
    text: 'Namaste Priya ✦ I\'ve loaded your birth chart — <strong>Vrishchika Lagna</strong>, Mesha Moon, currently running <strong>Saturn Mahadasha</strong> (2024–2043). Ask me anything about your chart, transits, career, relationships, or timing of events. I\'ll give you Vedic insights specific to your placements — not generic predictions.',
  },
  {
    type: 'user',
    text: 'Will 2026 be a good year for my career? I\'m thinking of switching jobs around June.',
  },
  {
    type: 'ai',
    text: '2026 is actually a <strong>significant year for your career</strong>, Priya — and June is well-timed. Here\'s why:<br/><br/><strong>Jupiter transits your 7th house</strong> (Vrishabha) from May 2026, forming a strong trine to your natal Saturn. For Vrishchika Lagna, this activates your 7th lord Venus, which governs partnerships and professional alliances — ideal for a new role, especially client-facing or management positions.<br/><br/>Your current <strong>Saturn Mahadasha</strong> with <strong>Mercury Antardasha</strong> (Mar–Dec 2026) brings disciplined communication energy. Mercury rules your 8th and 11th houses — gains through transformation and networks. A job switch through your existing network is strongly favoured.<br/><br/><strong>Avoid:</strong> Starting between Jul 17–Aug 11 (Mars retrograde squares your Lagna). The window of <strong>June 3–July 10</strong> is the clearest period.',
    insights: [
      { label: 'Lagna Lord', value: 'Mars in 8th' },
      { label: 'Jupiter transit', value: '7th house May+' },
      { label: 'Current Dasha', value: 'Sat–Merc' },
      { label: 'Best window', value: 'Jun 3–Jul 10' },
    ],
    dasha: {
      title: 'Your Dasha timeline — career periods',
      rows: [
        { planet: 'Saturn', fill: '12%', dates: '2024–2043', active: true },
        { planet: '↳ Mercury AD', fill: '55%', fillColor: 'var(--outline-variant)', dates: 'Mar–Dec 2026' },
        { planet: '↳ Ketu AD', fill: '20%', fillColor: 'var(--on-surface-variant)', dates: 'Dec 2026–Nov 2027' },
      ],
    },
  },
  {
    type: 'user',
    text: 'What remedy can help me during this Saturn Mahadasha?',
  },
  {
    type: 'ai',
    text: 'For <strong>Saturn Mahadasha with Vrishchika Lagna</strong>, Saturn rules your 3rd and 4th houses — effort, siblings, property, and mental peace. Saturn is a functional benefic for you but demands discipline.<br/><br/><strong>Key remedies:</strong><br/>— Visit Shani temple every <strong>Saturday</strong>, offer mustard oil and light a sesame oil diya<br/>— Recite <strong>Shani Beej Mantra</strong> (ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः) 108 times on Saturdays<br/>— Donate <strong>black sesame, iron, or black cloth</strong> to the needy on Saturdays<br/>— Wear <strong>Blue Sapphire (Neelam)</strong> in silver on middle finger of right hand — but only after checking with a Jyotishi as it is a strong stone<br/>— Serve elderly people and avoid shortcuts — Saturn rewards authentic effort',
  },
];

/* ---------- Sub-components ---------- */

const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[11px] text-on-surface-variant/50 bg-surface/40 px-3.5 py-1 rounded-full">
      {text}
    </span>
  </div>
);

/* ---------- Main Component ---------- */
const ChatMessages: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 chat-messages-scroll">
      {demoMessages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={i} text={msg.text} />;

        const isAi = msg.type === 'ai';

        const actions = isAi ? (
          <>
            {['👍 Helpful', '🔖 Save', '📋 Copy'].map((action) => (
              <button
                key={action}
                className="text-[10px] text-on-surface-variant/40 px-2 py-0.5 rounded border border-outline-variant/10 hover:text-on-surface-variant hover:border-outline-variant/25 transition-all duration-200 bg-transparent cursor-pointer"
              >
                {action}
              </button>
            ))}
          </>
        ) : null;

        return (
          <ChatBubble
            key={i}
            type={isAi ? 'ai' : 'user'}
            label={isAi ? 'NAVI · AI ASTROLOGER' : undefined}
            actions={actions}
          >
            {isAi ? (
              <>
                <div
                  className="text-on-surface-variant [&_strong]:text-secondary [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />

                {/* Insight Card */}
                {msg.insights && (
                  <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3 mt-3 !bg-surface/60">
                    <p className="text-[11px] font-bold text-secondary flex items-center gap-1.5 mb-2">
                      ✦ Chart factors for this reading
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {msg.insights.map((item) => (
                        <div key={item.label} className="bg-surface-variant/30 rounded-md px-2 py-1.5">
                          <p className="text-[9px] text-on-surface-variant/50 mb-0.5">{item.label}</p>
                          <p className="text-xs font-semibold text-on-surface-variant">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Dasha Card */}
                {msg.dasha && (
                  <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-secondary/15 !p-3 mt-3 !bg-surface/60">
                    <p className="text-[11px] font-bold text-secondary mb-2">{msg.dasha.title}</p>
                    {msg.dasha.rows.map((row) => (
                      <div key={row.planet} className="flex items-center gap-2 py-1 border-b border-outline-variant/10 last:border-b-0">
                        <span className="text-xs text-on-surface-variant w-[72px] shrink-0">{row.planet}</span>
                        <div className="flex-1 h-1 bg-outline-variant/15 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: row.fill,
                              backgroundColor: row.active ? 'var(--secondary)' : (row.fillColor || 'var(--outline-variant)'),
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant/50 whitespace-nowrap">
                          {row.dates}
                          {row.active && (
                            <span className="ml-1 text-[9px] bg-secondary text-on-primary px-1.5 py-px rounded font-bold">NOW</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            ) : (
              msg.text
            )}
          </ChatBubble>
        );
      })}
    </div>
  );
};

export default ChatMessages;
