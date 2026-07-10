'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useTranslation, useIsMobile, useResponsive } from '@/hooks';
import {
    ArrowUp, Mic,
    Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AVATAR_PLACEHOLDERS: Record<string, string[]> = {
  navi: [
    "Ask Navi about the cosmos...",
    "What guidance do you seek?",
    "Type your question to the stars...",
  ],
  career_mentor: [
    "Ask Arya about your career...",
    "What's holding back your professional growth?",
    "Type your question about work...",
  ],
  relationship_guide: [
    "Ask Meera about love...",
    "Share what's on your heart...",
    "Type your question about relationships...",
  ],
  spiritual_guide: [
    "Ask Anand about health...",
    "What guidance do you seek for your health?",
    "Type your question about well-being...",
  ],
  astro_sage: [
    "Ask Rishi about your chart...",
    "Which planet are you curious about?",
    "Type your question about astrology...",
  ],
  finance_mentor: [
    "Ask Vidya about finance...",
    "What's holding back your financial growth?",
    "Type your question about wealth...",
  ],
};

/** Short single-line placeholders for narrow viewports (≤480px) where the
 *  long versions wrap and stretch the textarea. */
const AVATAR_PLACEHOLDERS_SHORT: Record<string, string> = {
  navi: "Ask Navi…",
  career_mentor: "Ask Arya…",
  relationship_guide: "Ask Meera…",
  spiritual_guide: "Ask Anand…",
  astro_sage: "Ask Rishi…",
  finance_mentor: "Ask Vidya…",
};

const ChatInput: React.FC<{ onActivateVoice?: () => void }> = ({ onActivateVoice }) => {
  const {
    inputText, setInputText, sendMessage,
    isSending, activeChatId, createNewChat,
    selectedAvatarId
  } = useChat();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { width: viewportWidth } = useResponsive();
  const isNarrowViewport = viewportWidth > 0 && viewportWidth <= 480;
  
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const MAX_CHARS = 3000;
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !isMobile) return;
    const el = containerRef.current;

    const handleResize = () => {
      const keyboardHeight = window.innerHeight - vv.height;
      document.documentElement.style.setProperty(
        '--keyboard-height',
        keyboardHeight > 0 ? `${keyboardHeight}px` : '0px'
      );
    };

    const handleScroll = () => {
      if (el) {
        el.style.transform = `translateY(${vv.offsetTop}px)`;
      }
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleScroll);
    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleScroll);
      document.documentElement.style.removeProperty('--keyboard-height');
      if (el) {
        el.style.transform = '';
      }
    };
  }, [isMobile]);

  const currentPlaceholders = AVATAR_PLACEHOLDERS[selectedAvatarId ?? 'navi'] ?? AVATAR_PLACEHOLDERS.navi;
  const shortPlaceholder = AVATAR_PLACEHOLDERS_SHORT[selectedAvatarId ?? 'navi'] ?? AVATAR_PLACEHOLDERS_SHORT.navi;
  const activePlaceholder = isNarrowViewport
    ? shortPlaceholder
    : currentPlaceholders[placeholderIdx % currentPlaceholders.length];

  useEffect(() => {
    setPlaceholderIdx(0);
  }, [selectedAvatarId]);

  useEffect(() => {
    if (inputText.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % currentPlaceholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [inputText.length, currentPlaceholders]);

  const handleSend = () => {
    if (!inputText.trim() || isSending || isOverLimit) return;
    
    if (activeChatId) {
      sendMessage(inputText.trim());
    } else {
      createNewChat(inputText.trim());
    }
    setInputText('');
  };

  const inputRef = useRef(inputText);
  useEffect(() => { inputRef.current = inputText; }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setInputText('');
      textareaRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!inputRef.current.trim() || isSending) return;
        if (activeChatId) {
          sendMessage(inputRef.current.trim());
        } else {
          createNewChat(inputRef.current.trim());
        }
        setInputText('');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSending, activeChatId, sendMessage, createNewChat, setInputText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputText]);

  return (
    <div ref={containerRef} className="w-full px-2 sm:px-5 3xl:px-6 pb-[calc(0.5rem+env(safe-area-inset-bottom)+var(--keyboard-height,0px))] sm:pb-4 relative z-20 shrink-0"
    >
      <div className="chat-input-container relative flex flex-col overflow-hidden transition-all">
        {showPreview && inputText.length > 0 && (
          <div className="px-4 py-3 border-b border-outline-variant/15 max-h-[150px] overflow-y-auto text-[15px] text-foreground">
            <p className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-wider mb-1">{t('chat.input.preview')}</p>
            <div className="ai-message-content leading-[1.8] break-words" style={{ whiteSpace: 'pre-wrap' }}>
              {inputText}
            </div>
          </div>
        )}
        <div className="flex items-end gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 sm:py-3">
          {onActivateVoice && (
            <button
              onClick={onActivateVoice}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors text-foreground/40 hover:text-secondary hover:bg-secondary/10"
              title={t('chat.header.voiceMode')}
              aria-label={t('chat.header.voiceMode')}
            >
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputText.length > 0 ? '' : activePlaceholder}
            className="w-full bg-transparent border-none outline-none text-[14px] sm:text-[15px] 3xl:text-[17px] font-medium text-foreground placeholder:text-foreground/30 resize-none py-1.5 px-1 max-h-[150px] min-h-[38px] sm:min-h-0 no-scrollbar"
            rows={1}
          />

          {inputText.length > 0 && (
            <button
              onClick={() => setShowPreview(prev => !prev)}
              className={`chat-preview-toggle-mobile w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors text-foreground/40 hover:text-secondary hover:bg-secondary/10`}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || isOverLimit}
            className={`ripple-btn w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all gold-gradient text-on-primary shadow-md shadow-secondary/25 ${
              !inputText.trim() || isSending || isOverLimit
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:opacity-90 hover:scale-105 active:scale-95'
            }`}
          >
            <AnimatePresence mode="wait">
              {isSending ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ArrowUp className="w-4.5 h-4.5 animate-spin" />
                </motion.div>
              ) : (
                <motion.div key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <ArrowUp className="w-4.5 h-4.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;