'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { LOCALE_BY_LANGUAGE } from '@/locales';
import { useTranslation } from '@/hooks';
import { 
    Mic, MicOff, 
    ArrowUp, Zap, Sparkles, Gem,
    Paperclip, X, Image, FileText, Eye, EyeOff
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
    mode, setMode, attachments, addAttachment, removeAttachment
  } = useChat();
  const { language } = useTranslation();
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_CHARS = 3000;
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const showCharCount = charCount > MAX_CHARS * 0.8;

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
    <div className="w-full px-3 sm:px-5 3xl:px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 relative z-20 shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-secondary/10 border-2 border-secondary rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-sm font-semibold text-secondary">Drop files here</p>
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
            <p className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-wider mb-1">Preview</p>
            <div className="ai-message-content leading-[1.8] break-words" style={{ whiteSpace: 'pre-wrap' }}>
              {inputText}
            </div>
          </div>
        )}
        <div className="flex items-end gap-2 px-3.5 py-2.5">
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
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              attachments.length >= MAX_ATTACHMENTS
              ? 'text-foreground/15 cursor-not-allowed'
              : 'text-foreground/40 hover:text-secondary hover:bg-secondary/10'
            }`}
            title="Attach file"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

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

          {inputText.length > 0 && (
            <button
              onClick={() => setShowPreview(prev => !prev)}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors text-foreground/40 hover:text-secondary hover:bg-secondary/10"
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || isOverLimit}
            className={`ripple-btn w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              !inputText.trim() || isSending || isOverLimit
              ? 'bg-surface-variant/50 text-foreground/15 cursor-not-allowed'
              : 'gold-gradient text-on-primary hover:opacity-90 hover:scale-105 active:scale-95 shadow-md shadow-secondary/25'
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
