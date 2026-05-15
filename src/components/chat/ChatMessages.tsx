'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'isomorphic-dompurify';
import Card from '@/components/ui/Card';
import RatingMeter from '@/components/ui/RatingMeter';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import FeedbackModal from './FeedbackModal';
import { formatRelativeTime, formatDisplayDateTime } from '@/lib/datetime';
import { Volume2, Copy, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check } from 'lucide-react';

const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[13px] text-on-surface-variant/40 px-3 py-0.5">
      {text}
    </span>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="flex-1 px-4 sm:px-5 py-5 flex flex-col gap-4">
    <div className="h-6 w-64 mx-auto rounded-full bg-surface-variant/30" />
    <div className="flex gap-2.5 items-start max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-surface-variant/40 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-variant/30" />
        <div className="h-20 rounded-xl bg-surface-variant/20" />
      </div>
    </div>
  </div>
);

const quickReplyOptions = [
  'Tell me more',
  'What remedies?',
  'How long will this last?',
  'Next question',
];

const thinkingStatuses = [
  'Reading your chart...',
  'Consulting the stars...',
  'Interpreting transits...',
  'Aligning planetary data...',
];

const ThinkingIndicator: React.FC = () => {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % thinkingStatuses.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 items-start mt-4 mb-2">
      <div className="w-7 h-7 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <span className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
        <span className="text-[14px] text-on-surface-variant/50 italic">
          {thinkingStatuses[statusIdx]}
        </span>
      </div>
    </div>
  );
};

const ChatMessages: React.FC = () => {
  const { user } = useAuth();
  const { activeChat, isLoadingMessages, isSending, isFinalizing, createNewChat, rateMessage, regenerateMessage, sendMessage, activeChatId } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; messageId: string; initialRating: number }>({
    isOpen: false,
    messageId: '',
    initialRating: 0
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleRateAction = (messageId: string, rating: number) => {
    if (rating < 5) {
      setFeedbackModal({ isOpen: true, messageId, initialRating: rating });
    } else {
      rateMessage(messageId, rating);
    }
  };

  const handleFeedbackSubmit = (rating: number, tags: string[], comment: string) => {
    rateMessage(feedbackModal.messageId, rating, tags, comment);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [activeChat?.messages?.length, isSending]);

  if (!activeChat && !isLoadingMessages) {
    return null;
  }

  if (isLoadingMessages) {
    return <LoadingSkeleton />;
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const messages = activeChat?.messages || [];

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-2 min-w-0 w-full h-full"
      >
        <div className="flex min-h-full flex-col justify-end gap-4 sm:gap-5">
        <AnimatePresence mode="popLayout">
        {messages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={msg.id || i} text={msg.text} />;

        const isAi = msg.type === 'ai';
        const isLastAiMsg = isAi && i === messages.length - 1;

        let mainText = msg.text;
        let thinkingText = '';
        
        if (isAi && msg.text.includes('<tool_call>')) {
          const parts = msg.text.split('mentare');
          if (parts.length > 1) {
            thinkingText = parts[0].replace('<tool_call>', '').trim();
            mainText = parts.slice(1).join('mentare').trim();
          } else {
            thinkingText = msg.text.replace(' CPS', '').trim();
            mainText = '';
          }
        }

        const isSpeaking = speakingId === msg.id;

        const handleSpeak = (text: string) => {
          if (isSpeaking) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
          }
          const cleanText = text.replace(/<[^>]*>/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.onend = () => setSpeakingId(null);
          utterance.onerror = () => setSpeakingId(null);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
          setSpeakingId(msg.id);
        };

        if (isAi && !msg.text && isSending) return null;

        if (isAi) {
          return (
            <motion.div 
              key={msg.id || i} 
              className="group/msg relative"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  {thinkingText && (
                    <details className="mb-3 group/think">
                      <summary className="text-[13px] font-bold text-secondary/50 cursor-pointer list-none flex items-center gap-1.5 hover:text-secondary transition-colors">
                        <ChevronRight className="w-3 h-3 group-open/think:rotate-90 transition-transform" />
                        Thought process
                      </summary>
                      <div className="mt-2 pl-3 border-l border-secondary/15 text-[13px] text-on-surface-variant/50 italic leading-relaxed whitespace-pre-wrap">
                        {thinkingText}
                      </div>
                    </details>
                  )}

                  <div
                    className="text-on-surface-variant text-[15px] sm:text-[16px] leading-[1.7] max-w-[65ch] [&_strong]:text-secondary [&_strong]:font-semibold [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mainText) }}
                  />

                  {msg.insights && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-outline-variant/15 !p-3 mt-3 !bg-background">
                      <p className="text-[12px] font-bold text-secondary flex items-center gap-1.5 mb-2">
                        Chart factors for this reading
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.insights.map((item) => (
                          <div key={item.label} className="bg-surface-variant/25 rounded-md px-2 py-1.5">
                            <p className="text-[10px] text-on-surface-variant/40 mb-0.5">{item.label}</p>
                            <p className="text-[12px] font-semibold text-on-surface-variant">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {msg.dasha && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-secondary/10 !p-3 mt-3 !bg-background">
                      <p className="text-[13px] font-bold text-secondary mb-2">{msg.dasha.title}</p>
                      {msg.dasha.rows.map((row) => (
                        <div key={row.planet} className="flex items-center gap-2 py-1 border-b border-outline-variant/10 last:border-b-0">
                          <span className="text-[13px] text-on-surface-variant w-[72px] shrink-0">{row.planet}</span>
                          <div className="flex-1 h-1 bg-outline-variant/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: row.fill,
                                backgroundColor: row.active ? 'var(--secondary)' : (row.fillColor || 'var(--outline-variant)'),
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-on-surface-variant/40 whitespace-nowrap">
                            {row.dates}
                            {row.active && (
                              <span className="ml-1 text-[10px] bg-secondary text-on-primary px-1.5 py-px rounded font-bold">NOW</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              </div>

              {msg.createdAt && (
                <p className="text-[10px] text-on-surface-variant/25 mt-1 ml-10" title={formatDisplayDateTime(msg.createdAt)}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              )}

              {isAi && msg.id && !isFinalizing && (
                <div className="flex items-center gap-3 mt-1 ml-10 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity duration-200">
                  <RatingMeter
                    rating={msg.rating}
                    onRate={(rating) => handleRateAction(msg.id, rating)}
                    size="sm"
                  />
                  <div className="w-[1px] h-3 bg-outline-variant/30" />
                  <button
                    onClick={() => handleSpeak(mainText)}
                    className={`flex items-center justify-center rounded-md transition-colors cursor-pointer w-6 h-6 !min-w-0 !min-h-0 !p-0.5 ${isSpeaking ? 'text-secondary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                    title={isSpeaking ? "Stop" : "Speak"}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mainText.replace(/<[^>]*>/g, ''));
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="flex items-center justify-center rounded-md transition-colors cursor-pointer w-6 h-6 !min-w-0 !min-h-0 !p-0.5 text-on-surface-variant/30 hover:text-on-surface-variant"
                    title="Copy"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-secondary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isLastAiMsg && !isSending && (
                    <button
                      onClick={() => regenerateMessage(msg.id)}
                      className="flex items-center justify-center rounded-md transition-colors cursor-pointer w-6 h-6 !min-w-0 !min-h-0 !p-0.5 text-on-surface-variant/30 hover:text-secondary"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {isAi && isLastAiMsg && !isSending && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                  {(msg.suggestedQuestions?.slice(0, 3) || quickReplyOptions).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        if (activeChatId) {
                          sendMessage(option);
                        } else {
                          createNewChat(option);
                        }
                      }}
                      className="px-3 py-1 rounded-full text-[12px] font-medium text-on-surface-variant/60 bg-surface/50 border border-outline-variant/10 hover:border-secondary/25 hover:text-secondary hover:bg-secondary/5 transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        }

        return (
          <motion.div 
            key={msg.id || i} 
            className="flex justify-end items-start gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="max-w-[82%] sm:max-w-[min(75%,42rem)] bg-secondary/10 border border-secondary/20 rounded-2xl px-4 py-2.5 text-[14px] text-on-surface break-words" style={{ overflowWrap: 'anywhere' }}>
              {msg.text}
            </div>
            <div className="w-6 h-6 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary text-[11px] font-bold shrink-0">
              {userInitial}
            </div>
          </motion.div>
        );
        })}
        </AnimatePresence>

        {isSending && <ThinkingIndicator />}
        </div>
      </div>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        messageId={feedbackModal.messageId}
        initialRating={feedbackModal.initialRating}
        onSubmit={handleFeedbackSubmit}
      />

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 sm:right-6 w-9 h-9 rounded-full bg-surface border border-outline-variant/20 shadow-md flex items-center justify-center text-secondary hover:bg-surface-variant transition-all z-30"
            aria-label="Scroll to latest message"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMessages;
