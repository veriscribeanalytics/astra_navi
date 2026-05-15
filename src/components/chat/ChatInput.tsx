'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { LOCALE_BY_LANGUAGE } from '@/locales';
import { useTranslation } from '@/hooks';
import { 
    Mic, MicOff, 
    ArrowUp, Zap, Sparkles, Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const placeholderTexts = [
  'Ask about your career this month...',
  'What does Mercury retrograde mean for you?',
  'Tell me about my love prospects...',
  'How are the planets affecting my health?',
  'What remedies can improve my finances?',
  'When is the best time for a new venture?',
];

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const ChatInput: React.FC = () => {
  const { 
    inputText, setInputText, sendMessage, 
    isSending, activeChatId, createNewChat,
    mode, setMode
  } = useChat();
  const { language } = useTranslation();
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const MAX_CHARS = 3000;
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const showCharCount = charCount > MAX_CHARS * 0.8;
  const modeOptions = [
    { value: "quick" as const, label: "Quick", Icon: Zap },
    { value: "normal" as const, label: "Normal", Icon: Sparkles },
    { value: "deep" as const, label: "Deep", Icon: Gem },
  ];

  useEffect(() => {
    if (inputText.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholderTexts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [inputText.length]);

  useEffect(() => {
    const win = window as unknown as { SpeechRecognition?: new() => SpeechRecognition; webkitSpeechRecognition?: new() => SpeechRecognition };
    const WindowSpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (WindowSpeechRecognition) {
      recognitionRef.current = new WindowSpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => {
          const newText = prev ? `${prev} ${transcript}` : transcript;
          return newText.slice(0, MAX_CHARS);
        });
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          console.warn('Microphone permission denied.');
        } else if (event.error !== 'no-speech') {
          console.warn(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setSpeechSupported(false);
    }
  }, [setInputText]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isSending || isOverLimit) return;
    
    if (activeChatId) {
      sendMessage(inputText.trim());
    } else {
      createNewChat(inputText.trim());
    }
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputText]);

return (
    <div className="w-full px-3 sm:px-5 3xl:px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 relative z-20 shrink-0">
      <div className="relative flex flex-col bg-surface border border-outline-variant/35 rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.1)] focus-within:border-secondary/50 focus-within:shadow-[0_4px_28px_rgba(200,136,10,0.12)] transition-all">
        <div className="flex items-end gap-2 px-3.5 py-2.5">
          <button 
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              !speechSupported
              ? 'text-foreground/15 cursor-not-allowed'
              : isListening 
              ? 'bg-red-500/20 text-red-500 animate-pulse'
              : 'text-foreground/40 hover:text-secondary hover:bg-secondary/10'
            }`}
            title={!speechSupported ? "Voice input not supported" : isListening ? "Stop listening" : "Voice input"}
          >
            {!speechSupported ? <MicOff className="w-4.5 h-4.5" /> : isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputText.length > 0 ? '' : placeholderTexts[placeholderIdx]}
            className="w-full bg-transparent border-none outline-none text-[15px] 3xl:text-[17px] font-medium text-foreground placeholder:text-foreground/30 resize-none py-2.5 px-1 max-h-[150px] no-scrollbar"
            rows={1}
          />

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || isOverLimit}
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              !inputText.trim() || isSending || isOverLimit
              ? 'bg-surface-variant/50 text-foreground/15 cursor-not-allowed'
              : 'bg-secondary text-on-primary hover:bg-secondary/90 hover:scale-105 active:scale-95 shadow-md shadow-secondary/25'
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

        <div className="flex flex-col gap-2 px-3.5 py-2 border-t border-outline-variant/15 bg-background/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2.5">
            {modeOptions.map(({ value: m, label, Icon }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] 3xl:text-[14px] font-bold uppercase tracking-wider transition-all ${
                  mode === m
                    ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-sm shadow-secondary/10'
                    : 'text-foreground/40 hover:text-foreground/60 hover:bg-surface-variant/30 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            <span className="text-[11px] 3xl:text-[13px] text-foreground/25 hidden sm:inline ml-1">Navi uses your birth chart</span>
          </div>
          {showCharCount && (
            <p className={`text-[11px] 3xl:text-[13px] font-bold ${isOverLimit ? 'text-red-500' : 'text-foreground/30'}`}>
              {charCount}/{MAX_CHARS}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
