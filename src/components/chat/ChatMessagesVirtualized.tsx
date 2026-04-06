'use client';

import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import Card from '@/components/ui/Card';
import ChatBubble from '@/components/ui/ChatBubble';
import RatingMeter from '@/components/ui/RatingMeter';
import { useChat } from '@/context/ChatContext';

/* ---------- Sub-components ---------- */
const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[11px] text-on-surface-variant/50 bg-surface/40 px-3.5 py-1 rounded-full">
      {text}
    </span>
  </div>
);

const EmptyState: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center max-w-md px-6">
      <div className="text-5xl mb-4 opacity-30">✦</div>
      <h3 className="text-lg font-headline font-bold text-on-surface/80 mb-2">
        Start a Conversation
      </h3>
      <p className="text-sm text-on-surface-variant/50 mb-6 leading-relaxed">
        Select a recent chat from the sidebar or start a new conversation to get personalized Vedic astrology insights.
      </p>
      <button
        onClick={onNewChat}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-primary text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] cursor-pointer"
      >
        ✦ New Conversation
      </button>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="flex-1 px-5 py-5 flex flex-col gap-4 animate-pulse">
    <div className="h-6 w-64 mx-auto rounded-full bg-surface-variant/30" />
    <div className="flex gap-2.5 items-start max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-surface-variant/40 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-variant/30" />
        <div className="h-20 rounded-2xl bg-surface-variant/20" />
      </div>
    </div>
  </div>
);

const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex gap-2.5 items-start max-w-[85%] animate-in fade-in zoom-in-95 duration-500 mb-2 mt-4">
      <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm shrink-0 mt-0.5 shadow-sm shadow-secondary/5">
        <span className="animate-spin" style={{ animationDuration: '3s' }}>✦</span>
      </div>
      <div className="chat-ai-bubble relative overflow-hidden">
        <p className="text-[10px] text-secondary font-bold tracking-wider mb-2 uppercase flex items-center gap-1.5">
          <span>NAVI · AI ASTROLOGER</span>
          <span className="flex gap-0.5">
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </p>
        
        <div className="flex items-center gap-2 text-[12.5px] text-on-surface-variant/70 font-medium italic animate-pulse">
          Navi is typing...
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
const ChatMessages: React.FC = () => {
  const { activeChat, isLoadingMessages, isSending, createNewChat, rateMessage } = useChat();
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = activeChat?.messages || [];

  // Auto-scroll to bottom when messages or isSending change (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length, isSending]);

  // No active chat
  if (!activeChat && !isLoadingMessages) {
    return <EmptyState onNewChat={() => createNewChat()} />;
  }

  // Loading
  if (isLoadingMessages) {
    return <LoadingSkeleton />;
  }

  const handleSpeak = (text: string) => {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Row renderer for virtualized list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const msg = messages[index];
    
    if (msg.type === 'system') {
      return (
        <div style={style}>
          <SystemBubble text={msg.text} />
        </div>
      );
    }

    const isAi = msg.type === 'ai';

    const copyAction = isAi ? (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSpeak(msg.text)}
          className="group/speak flex items-center gap-1.5 text-on-surface-variant/40 hover:text-on-surface-variant p-1 rounded-md transition-colors cursor-pointer"
          title="Speak Message"
        >
          <span className="material-symbols-outlined text-[16px] group-active/speak:scale-90 transition-transform">volume_up</span>
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(msg.text.replace(/<[^>]*>/g, ''))}
          className="group/copy flex items-center gap-1.5 text-on-surface-variant/40 hover:text-on-surface-variant p-1 rounded-md transition-colors cursor-pointer"
          title="Copy Message"
        >
          <span className="material-symbols-outlined text-[16px] group-active/copy:scale-90 transition-transform">content_copy</span>
        </button>
      </div>
    ) : null;

    if (isAi && !msg.text && isSending) return <div style={style} />;

    return (
      <div style={style} className="px-4 sm:px-5">
        <div className="mb-4">
          <ChatBubble
            type={isAi ? 'ai' : 'user'}
            label={isAi ? 'NAVI · AI ASTROLOGER' : undefined}
          >
            {isAi ? (
              <>
                <div
                  className="text-on-surface-variant [&_strong]:text-secondary [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />

                {msg.insights && (
                  <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3 mt-3">
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

                {msg.dasha && (
                  <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-secondary/15 !p-3 mt-3">
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

          {isAi && msg.id && (
            <div className="flex items-center justify-between ml-[42px] mt-1 pr-2">
              <RatingMeter
                rating={msg.rating}
                onRate={(rating) => rateMessage(msg.id, rating)}
                size="md"
              />
              {copyAction}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate item size (approximate)
  const getItemSize = (index: number) => {
    const msg = messages[index];
    if (msg.type === 'system') return 40;
    
    // Estimate based on message length
    const baseHeight = 120;
    const textHeight = Math.ceil(msg.text.length / 80) * 20;
    const insightsHeight = msg.insights ? 120 : 0;
    const dashaHeight = msg.dasha ? 200 : 0;
    
    return baseHeight + textHeight + insightsHeight + dashaHeight;
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col">
      <List
        ref={listRef}
        height={containerRef.current?.clientHeight || 600}
        itemCount={messages.length + (isSending ? 1 : 0)}
        itemSize={getItemSize}
        width="100%"
        className="chat-messages-scroll"
      >
        {Row}
      </List>

      {isSending && (
        <div className="px-4 sm:px-5">
          <ThinkingIndicator />
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
