'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Card from '@/components/ui/Card';
import ChatBubble from '@/components/ui/ChatBubble';
import RatingMeter from '@/components/ui/RatingMeter';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import FeedbackModal from './FeedbackModal';
import { useState } from 'react';
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from '@/utils/personalizedQuestions';

/* ---------- Sub-components ---------- */
const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[11px] text-on-surface-variant/50 bg-surface/40 px-3.5 py-1 rounded-full">
      {text}
    </span>
  </div>
);

const EmptyState: React.FC<{ onNewChat: () => void; onQuestionClick: (question: string) => void; suggestedQuestions: string[] }> = ({ onNewChat, onQuestionClick, suggestedQuestions }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center max-w-2xl px-6">
      <div className="text-5xl mb-4 opacity-30">✦</div>
      <h3 className="text-lg font-headline font-bold text-on-surface/80 mb-2">
        Start a Conversation
      </h3>
      <p className="text-sm text-on-surface-variant/50 mb-6 leading-relaxed">
        Select a recent chat from the sidebar or start a new conversation to get personalized Vedic astrology insights.
      </p>
      
      {/* Suggested Questions */}
      <div className="mb-6 space-y-2">
        <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Suggested Questions</p>
        {suggestedQuestions.map((question, idx) => (
          <button
            key={idx}
            onClick={() => onQuestionClick(question)}
            className="w-full text-left text-sm text-on-surface-variant/70 bg-surface/50 border border-outline-variant/20 px-4 py-3 rounded-xl hover:border-secondary/40 hover:bg-surface/80 transition-all hover:text-secondary active:scale-98"
          >
            {question}
          </button>
        ))}
      </div>

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
          behavior: 'smooth'
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
      className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-3 sm:py-4 pb-2 flex flex-col gap-3 sm:gap-4 chat-messages-scroll"
    >
      {messages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={msg.id || i} text={msg.text} />;

        const isAi = msg.type === 'ai';

        const handleSpeak = (text: string) => {
          // Remove HTML tags if present (though dangerouslySetInnerHTML is used)
          const cleanText = text.replace(/<[^>]*>/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          // Detect language (simplified: default to English but could be enhanced)
          // Web Speech API will use system default voice
          window.speechSynthesis.cancel(); // Stop any current speech
          window.speechSynthesis.speak(utterance);
        };

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

        if (isAi && !msg.text && isSending) return null;

        return (
          <div key={msg.id || i}>
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

                  {/* Insight Card */}
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

                  {/* Dasha Card */}
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

            {/* Rating meter & Copy below every AI message */}
            {isAi && msg.id && (
              <div className="flex items-center justify-between ml-[42px] mt-1 pr-2">
                <RatingMeter
                  rating={msg.rating}
                  onRate={(rating) => handleRateAction(msg.id, rating)}
                  size="md"
                />
                {copyAction}
              </div>
            )}
          </div>
        );
      })}

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
