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
import { Volume2, Copy, ChevronRight, Sparkles } from 'lucide-react';
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

const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex gap-2.5 items-start max-w-[85%] mb-2 mt-4">
      <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm shrink-0 mt-0.5">
        <span>✦</span>
      </div>
      <div className="chat-ai-bubble relative overflow-hidden">
        <p className="text-[13px] text-secondary font-bold tracking-wider mb-2 uppercase flex items-center gap-1.5">
          <span>NAVI · AI ASTROLOGER</span>
          <span className="flex gap-0.5">
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80" />
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80" />
            <span className="w-0.5 h-0.5 rounded-full bg-secondary/80" />
          </span>
        </p>
        
        <div className="flex items-center gap-2 text-[15px] text-on-surface-variant/70 font-medium italic">
          Navi is typing...
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
const ChatMessages: React.FC = () => {
  const { user } = useAuth();
  const { activeChat, isLoadingMessages, isSending, createNewChat, rateMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; messageId: string; initialRating: number }>({
    isOpen: false,
    messageId: '',
    initialRating: 0
  });

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

  const messages = activeChat?.messages || [];

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-3 sm:py-4 pb-2 flex flex-col gap-3 sm:gap-4 min-w-0 w-full"
    >
      <AnimatePresence mode="popLayout">
      {messages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={msg.id || i} text={msg.text} />;

        const isAi = msg.type === 'ai';

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

        const handleSpeak = (text: string) => {
          // Remove HTML tags if present (though dangerouslySetInnerHTML is used)
          const cleanText = text.replace(/<[^>]*>/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          window.speechSynthesis.cancel(); 
          window.speechSynthesis.speak(utterance);
        };

        const copyAction = isAi ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSpeak(mainText)}
              className="group/speak flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface-variant rounded-md transition-colors cursor-pointer w-7 h-7 !min-w-0 !min-h-0 !p-1"
              title="Speak Message"
            >
              <Volume2 className="w-4 h-4 group-active/speak:scale-90 transition-transform" />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(mainText.replace(/<[^>]*>/g, ''))}
              className="group/copy flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface-variant rounded-md transition-colors cursor-pointer w-7 h-7 !min-w-0 !min-h-0 !p-1"
              title="Copy Message"
            >
              <Copy className="w-4 h-4 group-active/copy:scale-90 transition-transform" />
            </button>
          </div>
        ) : null;

        if (isAi && !msg.text && isSending) return null;

        return (
          <motion.div 
            key={msg.id || i} 
            className="group/msg relative"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ChatBubble
              type={isAi ? 'ai' : 'user'}
              label={isAi ? 'NAVI · AI ASTROLOGER' : undefined}
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
                    className="text-on-surface-variant text-[14px] sm:text-[15px] leading-[1.6] [&_strong]:text-secondary [&_strong]:font-semibold"
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

            {/* Rating meter & Copy below every AI message - Only visible on hover */}
            {isAi && msg.id && (
              <div className="flex items-center justify-between w-full mt-1.5 px-2 mb-2 opacity-0 group-hover/msg:opacity-100 transition-all duration-300">
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
  );
};

export default ChatMessages;
