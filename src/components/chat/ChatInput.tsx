'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { LOCALE_BY_LANGUAGE } from '@/locales';
import { useTranslation, useIsMobile, useResponsive } from '@/hooks';
import { 
    Mic, MicOff, 
    ArrowUp, Zap, Sparkles, Gem,
    Paperclip, X, Image, FileText, Eye, EyeOff
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

const modeCycleOrder: Array<'quick' | 'normal' | 'deep'> = ['quick', 'normal', 'deep'];

const modeOptionMap: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  quick: { label: 'Instant', Icon: Zap },
  normal: { label: 'Standard', Icon: Sparkles },
  deep: { label: 'Deep Analysis', Icon: Gem },
};

const ChatInput: React.FC = () => {
  const { 
    inputText, setInputText, sendMessage, 
    isSending, activeChatId, createNewChat,
    mode, setMode, attachments, addAttachment, removeAttachment,
    selectedAvatarId
  } = useChat();
  const { t, language } = useTranslation();
  const isMobile = useIsMobile();
  const { width: viewportWidth } = useResponsive();
  const isNarrowViewport = viewportWidth > 0 && viewportWidth <= 480;
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const MAX_CHARS = 3000;
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const showCharCount = charCount > MAX_CHARS * 0.8;

  const cycleMode = useCallback(() => {
    const currentIdx = modeCycleOrder.indexOf(mode);
    const nextIdx = (currentIdx + 1) % modeCycleOrder.length;
    setMode(modeCycleOrder[nextIdx]);
  }, [mode, setMode]);

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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (attachments.length >= MAX_ATTACHMENTS) break;
      if (file.size > MAX_FILE_SIZE) continue;
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) continue;
      addAttachment(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const modeOptions = [
    { value: "quick" as const, label: "Instant", Icon: Zap },
    { value: "normal" as const, label: "Standard", Icon: Sparkles },
    { value: "deep" as const, label: "Deep Analysis", Icon: Gem },
  ];

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

  const currentModeOpt = modeOptionMap[mode];
  const CycleIcon = currentModeOpt?.Icon || Sparkles;
  const cycleLabel = currentModeOpt?.label || 'Normal';

  return (
    <div ref={containerRef} className="w-full px-2 sm:px-5 3xl:px-6 pb-[calc(0.5rem+env(safe-area-inset-bottom)+var(--keyboard-height,0px))] sm:pb-4 relative z-20 shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-secondary/10 border-2 border-secondary rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-sm font-semibold text-secondary">{t('chat.input.dropFiles')}</p>
            <p className="text-xs text-on-surface-variant/50">Images & PDFs only</p>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 sm:px-5 pb-2">
          {attachments.map((att) => (
            <div key={att.id} className="relative group flex items-center gap-2 px-3 py-2 bg-surface border border-outline-variant/30 rounded-xl text-[12px] max-w-[180px]">
              {att.type.startsWith('image/') && att.preview ? (
                <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover shrink-0" />
              ) : att.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-secondary shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="truncate text-on-surface-variant">{att.name}</span>
              <span className="text-on-surface-variant/30 shrink-0">{formatFileSize(att.size)}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant/50 hover:text-red-400 hover:border-red-400/30 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

        {/* Bottom Toolbar: Attach, Voice, Mode, Char Count */}
        <div className="flex flex-row items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-t border-outline-variant/15 bg-background/50 gap-2">
          {/* Left tools: Paperclip, Voice */}
          <div className="flex items-center gap-1 sm:gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                attachments.length >= MAX_ATTACHMENTS
                ? 'text-foreground/15 cursor-not-allowed'
                : 'text-foreground/40 hover:text-secondary hover:bg-secondary/10'
              }`}
              title={t('chat.input.attachFile')}
            >
              <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            <button
              onClick={toggleListening}
              disabled={!speechSupported}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                !speechSupported
                ? 'text-foreground/15 cursor-not-allowed'
                : isListening 
                ? 'bg-red-500/20 text-red-500 animate-pulse'
                : 'text-foreground/40 hover:text-secondary hover:bg-secondary/10'
              }`}
              title={!speechSupported ? "Voice input not supported" : isListening ? "Stop listening" : "Voice input"}
            >
              {!speechSupported ? <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : isListening ? <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>
          </div>

          {/* Right/Center: Mode Selector and character count */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Desktop Mode Selector */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2.5">
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
            </div>

            {/* Mobile Mode Selector */}
            <button
              onClick={cycleMode}
              className="sm:hidden inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-secondary/15 text-secondary border border-secondary/25 shrink-0 text-[11px] font-bold uppercase tracking-wide"
              title={`Mode: ${cycleLabel} — tap to cycle`}
              aria-label={`Mode: ${cycleLabel}`}
            >
              <CycleIcon className="w-3.5 h-3.5" />
              <span>{cycleLabel}</span>
            </button>

            <span className="text-[11px] 3xl:text-[13px] text-foreground/25 hidden md:inline ml-1">
              {t('chat.input.naviUsesChart')}{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary/50 hover:text-secondary underline underline-offset-2 transition-colors">
                (DPDP-compliant AI processing)
              </a>
            </span>
            
            {showCharCount && (
              <p className={`text-[11px] 3xl:text-[13px] font-bold ${isOverLimit ? 'text-red-500' : 'text-foreground/30'} ml-2`}>
                {charCount}/{MAX_CHARS}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;