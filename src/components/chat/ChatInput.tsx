'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { 
    Mic, MicOff, RotateCcw, 
    ArrowUp, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '@/hooks';

// Type definitions for Web Speech API
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
    isSending, activeChatId, createNewChat
  } = useChat();
  const { t } = useTranslation();
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const MAX_CHARS = 1000;
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;

  useEffect(() => {
    // Initialize Web Speech API
    const win = window as unknown as { SpeechRecognition?: new() => SpeechRecognition; webkitSpeechRecognition?: new() => SpeechRecognition };
    const WindowSpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (WindowSpeechRecognition) {
      recognitionRef.current = new WindowSpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 sm:pb-6 relative z-20">
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-secondary/10 via-amber-500/5 to-secondary/10 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />
        
        <div className="relative flex flex-col bg-surface/80 backdrop-blur-2xl border border-outline-variant/20 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] group-focus-within:border-secondary/40 transition-all duration-500">
          
          <div className="flex items-end p-2 sm:p-3">
            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 pb-1.5 sm:pb-2">
              <button 
                onClick={() => setInputText('')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-foreground/30 hover:text-secondary hover:bg-secondary/10 transition-all active:scale-90"
                title="Clear input"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={toggleListening}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                  isListening 
                  ? 'bg-red-500/20 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'text-foreground/30 hover:text-secondary hover:bg-secondary/10'
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            {/* Input Area */}
            <div className="flex-1 min-h-[48px] sm:min-h-[56px] flex items-center px-1 sm:px-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('horoscope.askNaviAboutToday') + "..."}
                className="w-full bg-transparent border-none outline-none text-[13px] sm:text-[15px] font-medium text-foreground placeholder:text-foreground/25 resize-none py-3 px-1 max-h-[120px] scrollbar-hide"
                rows={1}
              />
            </div>

            {/* Send Button */}
            <div className="px-1 sm:px-2 pb-1.5 sm:pb-2">
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isSending || isOverLimit}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group/send ${
                  !inputText.trim() || isSending || isOverLimit
                  ? 'bg-surface-variant/50 text-foreground/10 cursor-not-allowed'
                  : 'bg-secondary text-background shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isSending ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center"
                    >
                      <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/send:-translate-y-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-2 bg-black/5 flex items-center justify-between border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Navi is online</p>
            </div>
            {charCount > 0 && (
              <p className={`text-[9px] font-bold uppercase tracking-widest ${isOverLimit ? 'text-red-500' : 'text-foreground/20'}`}>
                {charCount} / {MAX_CHARS}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
