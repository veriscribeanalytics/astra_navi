'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'isomorphic-dompurify';
import Card from '@/components/ui/Card';
import ChatBubble from '@/components/ui/ChatBubble';
import RatingMeter from '@/components/ui/RatingMeter';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import FeedbackModal from './FeedbackModal';
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from '@/utils/personalizedQuestions';
import { formatRelativeTime, formatDisplayDateTime } from '@/lib/datetime';
import { Volume2, Copy, ChevronRight, Sparkles, ChevronDown, RefreshCw } from 'lucide-react';
import KundliSvg from '@/components/ui/astrology/KundliSvg';

/* ---------- Sub-components ---------- */
const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[14px] text-on-surface-variant/50 bg-surface px-3.5 py-1 rounded-full">
      {text}
    </span>
  </div>
);

const EmptyState: React.FC<{ onNewChat: () => void; onQuestionClick: (question: string) => void; suggestedQuestions: string[] }> = ({ onNewChat, onQuestionClick, suggestedQuestions }) => (
  <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-10 max-w-5xl mx-auto w-full px-4 xl:px-8 py-8">
    <div className="w-full max-w-[320px] xl:max-w-[400px] shrink-0 mx-auto order-2 xl:order-1">
      <div className="bg-surface/50 rounded-[32px] p-6 border border-outline-variant/10 shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-xl mb-4 text-center">
         <h4 className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Your Cosmic Blueprint
         </h4>
         <KundliSvg className="w-full mix-blend-luminosity drop-shadow-xl" />
      </div>
    </div>

    <div className="text-center xl:text-left max-w-md mx-auto xl:mx-0 w-full order-1 xl:order-2">
      <div className="text-4xl mb-4 opacity-30 text-secondary hidden xl:block">✦</div>
      <h3 className="text-2xl font-headline font-bold text-on-surface/90 mb-3 tracking-tight">
        Start a Conversation
      </h3>
      <p className="text-[15px] text-on-surface-variant/60 mb-8 leading-relaxed">
        Select a recent chat from the sidebar or start a new conversation to get personalized Vedic astrology insights based on your birth chart.
      </p>
      
      {/* Suggested Questions */}
      <div className="mb-8 space-y-2.5">
        <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em] mb-4">Suggested Questions</p>
        {suggestedQuestions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onQuestionClick(question)}
            className="w-full text-left text-[14px] text-on-surface-variant/80 bg-surface/40 border border-outline-variant/15 px-4 py-3.5 rounded-2xl hover:border-secondary/30 hover:bg-surface/80 hover:shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            {question}
          </button>
        ))}
      </div>

      <button
        onClick={onNewChat}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary text-on-primary text-[14px] font-bold shadow-lg shadow-secondary/20 transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer"
      >
        <Sparkles className="w-4 h-4" /> New Conversation
      </button>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="flex-1 px-5 py-5 flex flex-col gap-4">
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

const quickReplyOptions = [
  'Tell me more',
  'What remedies?',
  'How long will this last?',
  'Next question',
];

const thinkingStatuses = [
  '✦ Reading your chart...',
  '✦ Consulting the stars...',
  '✦ Interpreting transits...',
  '✦ Aligning planetary data...',
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
    <div className="flex gap-2.5 items-start max-w-[720px] mb-2 mt-4">
      <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm shrink-0 mt-0.5 shadow-[0_0_12px_rgba(200,136,10,0.2)]">
        <span>✦</span>
      </div>
      <div className="chat-ai-bubble relative overflow-hidden">
        <p className="text-[10px] text-secondary font-bold tracking-wider mb-2 uppercase flex items-center gap-1.5">
          <span>NAVI · AI ASTROLOGER</span>
        </p>
        
        <div className="flex items-center gap-3">
          <span className="flex gap-1 items-center">
            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
          <span className="text-[15px] text-on-surface-variant/70 font-medium italic transition-all duration-500">
            {thinkingStatuses[statusIdx]}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
const ChatMessages: React.FC = () => {
  const { user } = useAuth();
  const { activeChat, isLoadingMessages, isSending, createNewChat, rateMessage, sendMessage, activeChatId } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; messageId: string; initialRating: number }>({
    isOpen: false,
    messageId: '',
    initialRating: 0
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Calculate age and get personalized questions
  const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
  const ageBracket = useMemo(() => getAgeBracket(age), [age]);
  const suggestedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);

  const handleQuestionClick = (question: string) => {
    createNewChat(question);
  };

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

  // Detect when user scrolls up from the bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Show button when more than 150px from bottom
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Auto-scroll to bottom when messages or isSending change (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'auto'
        });
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [activeChat?.messages?.length, isSending]);

  // No active chat
  if (!activeChat && !isLoadingMessages) {
    return <EmptyState onNewChat={() => createNewChat()} onQuestionClick={handleQuestionClick} suggestedQuestions={suggestedQuestions} />;
  }

  // Loading
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
        className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-3 sm:py-4 pb-2 flex flex-col gap-3 sm:gap-4 min-w-0 w-full h-full"
      >
      <AnimatePresence mode="popLayout">
      {messages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={msg.id || i} text={msg.text} />;

        const isAi = msg.type === 'ai';
        // Check if this is the last AI message in the conversation
        const isLastAiMsg = isAi && i === messages.length - 1;

        // --- NEW: Parsing thinking tags ---
        let mainText = msg.text;
        let thinkingText = '';
        
        if (isAi && msg.text.includes('<think>')) {
          const parts = msg.text.split('</think>');
          if (parts.length > 1) {
            thinkingText = parts[0].replace('<think>', '').trim();
            mainText = parts.slice(1).join('</think>').trim();
          } else {
            // Still thinking or tag not closed
            thinkingText = msg.text.replace('<think>', '').trim();
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

        const copyAction = isAi ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSpeak(mainText)}
              className={`group/speak flex items-center justify-center rounded-md transition-colors cursor-pointer w-7 h-7 !min-w-0 !min-h-0 !p-1 ${isSpeaking ? 'text-secondary bg-secondary/10' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
              title={isSpeaking ? "Stop speaking" : "Speak Message"}
            >
              <Volume2 className={`w-4 h-4 group-active/speak:scale-90 transition-transform ${isSpeaking ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(mainText.replace(/<[^>]*>/g, ''));
                setCopiedId(msg.id);
                setTimeout(() => setCopiedId(null), 2000);
              }}
              className="group/copy flex items-center justify-center rounded-md transition-colors cursor-pointer w-7 h-7 !min-w-0 !min-h-0 !p-1 text-on-surface-variant/40 hover:text-on-surface-variant"
              title="Copy Message"
            >
              {copiedId === msg.id ? (
                <span className="text-secondary text-[10px] font-bold">✓</span>
              ) : (
                <Copy className="w-4 h-4 group-active/copy:scale-90 transition-transform" />
              )}
            </button>
            {isLastAiMsg && !isSending && (
              <button
                onClick={() => {
                  // Re-send the user message that preceded this AI response
                  const prevUserMsg = [...messages].reverse().find(m => m.type === 'user' && messages.indexOf(m) < i);
                  if (prevUserMsg && activeChatId) {
                    sendMessage(prevUserMsg.text);
                  }
                }}
                className="group/regen flex items-center justify-center rounded-md transition-colors cursor-pointer w-7 h-7 !min-w-0 !min-h-0 !p-1 text-on-surface-variant/40 hover:text-secondary"
                title="Regenerate response"
              >
                <RefreshCw className="w-4 h-4 group-active/regen:scale-90 transition-transform" />
              </button>
            )}
          </div>
        ) : null;

        if (isAi && !msg.text && isSending) return null;

        return (
          <motion.div 
            key={msg.id || i} 
            className="group/msg relative"
            initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ChatBubble
              type={isAi ? 'ai' : 'user'}
              label={isAi ? 'NAVI · AI ASTROLOGER' : undefined}
              avatar={isAi ? undefined : userInitial}
            >
              {isAi ? (
                <>
                  {/* Thought Process Dropdown */}
                  {thinkingText && (
                    <details className="mb-3 group/think">
                      <summary className="text-[14px] font-bold text-secondary/60 cursor-pointer list-none flex items-center gap-1.5 hover:text-secondary transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 group-open/think:rotate-90 transition-transform" />
                        ✦ Thought process
                      </summary>
                      <div className="mt-2 pl-3 border-l border-secondary/20 text-[14px] text-on-surface-variant/60 italic leading-relaxed whitespace-pre-wrap">
                        {thinkingText}
                      </div>
                    </details>
                  )}

                  <div
                    className="text-on-surface-variant text-[15px] sm:text-[16px] leading-[1.75] [&_strong]:text-secondary [&_strong]:font-semibold [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mainText) }}
                  />

                  {/* Insight Card */}
                  {msg.insights && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3 mt-3 !bg-background">
                      <p className="text-[13px] font-bold text-secondary flex items-center gap-1.5 mb-2">
                        ✦ Chart factors for this reading
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.insights.map((item) => (
                          <div key={item.label} className="bg-surface-variant/30 rounded-md px-2 py-1.5">
                            <p className="text-[11px] text-on-surface-variant/50 mb-0.5">{item.label}</p>
                            <p className="text-[13px] font-semibold text-on-surface-variant">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Dasha Card */}
                  {msg.dasha && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-secondary/15 !p-3 mt-3 !bg-background">
                      <p className="text-[14px] font-bold text-secondary mb-2">{msg.dasha.title}</p>
                      {msg.dasha.rows.map((row) => (
                        <div key={row.planet} className="flex items-center gap-2 py-1 border-b border-outline-variant/10 last:border-b-0">
                          <span className="text-[14px] text-on-surface-variant w-[72px] shrink-0">{row.planet}</span>
                          <div className="flex-1 h-1 bg-outline-variant/15 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: row.fill,
                                backgroundColor: row.active ? 'var(--secondary)' : (row.fillColor || 'var(--outline-variant)'),
                              }}
                            />
                          </div>
                          <span className="text-[12px] text-on-surface-variant/50 whitespace-nowrap">
                            {row.dates}
                            {row.active && (
                              <span className="ml-1 text-[11px] bg-secondary text-on-primary px-1.5 py-px rounded font-bold">NOW</span>
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

            {/* Message Timestamp */}
            {msg.createdAt && (
              <p className={`text-[10px] text-on-surface-variant/30 mt-1 ${isAi ? 'ml-10' : 'text-right mr-1'}`} title={formatDisplayDateTime(msg.createdAt)}>
                {formatRelativeTime(msg.createdAt)}
              </p>
            )}

            {/* Rating meter & Copy below every AI message - Always visible on mobile, hover-reveal on desktop */}
            {isAi && msg.id && (
              <div className="flex items-center justify-between w-full mt-1.5 px-2 mb-2 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-all duration-300">
                <span className="text-[11px] font-bold text-on-surface-variant/30 tracking-widest uppercase">
                  Quality check
                </span>
                <div className="flex items-center gap-2">
                  <RatingMeter
                    rating={msg.rating}
                    onRate={(rating) => handleRateAction(msg.id, rating)}
                    size="sm"
                  />
                  <div className="w-[1px] h-3 bg-outline-variant/40 ml-0.5 mr-0.5" />
                  {copyAction}
                </div>
              </div>
            )}

            {/* Quick-reply chips after the last AI message */}
            {isAi && isLastAiMsg && !isSending && (
              <div className="flex flex-wrap gap-2 mt-1 ml-10">
                {quickReplyOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (activeChatId) {
                        sendMessage(option);
                      } else {
                        createNewChat(option);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-on-surface-variant/70 bg-surface-variant/30 border border-outline-variant/15 hover:border-secondary/30 hover:bg-secondary/10 hover:text-secondary transition-all active:scale-95"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
      </AnimatePresence>

      {/* AI Processing sequence */}
      {isSending && <ThinkingIndicator />}

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        messageId={feedbackModal.messageId}
        initialRating={feedbackModal.initialRating}
        onSubmit={handleFeedbackSubmit}
      />
    </div>

      {/* Scroll to Bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 sm:right-6 w-10 h-10 rounded-full bg-surface border border-outline-variant/30 shadow-lg flex items-center justify-center text-secondary hover:bg-surface-variant hover:scale-105 active:scale-95 transition-all z-30"
            aria-label="Scroll to latest message"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMessages;
