'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';

const ChatInput: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isSending, activeChat, inputText, setInputText } = useChat();
  const [isListening, setIsListening] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const MAX_CHARS = 2000;

  // Auto-resize textarea (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [inputText]);

  // Update character count
  useEffect(() => {
    setCharCount(inputText.length);
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending || charCount > MAX_CHARS) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => {
          const newText = prev ? `${prev} ${transcript}` : transcript;
          return newText.slice(0, MAX_CHARS);
        });
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings to use voice input.');
        } else if (event.error !== 'no-speech') {
          alert(`Voice input error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setInputText]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert('Voice input is not supported in your browser.');
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Don't show input if no active chat
  if (!activeChat) return null;

  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div className="shrink-0 bg-background border-t border-outline-variant/10">
      {/* Input Area */}
      <div className="px-5 pt-2 pb-4">
        <div className={`chat-input-container transition-colors ${isOverLimit ? '!border-red-500/50' : ''}`}>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Ask Navi anything about your chart, transits, timing, or remedies..."
            rows={1}
            disabled={isSending}
            aria-label="Chat message input"
            className="flex-1 bg-transparent border-none outline-none text-on-surface text-[13px] font-body resize-none leading-relaxed min-h-[20px] max-h-[100px] placeholder:text-on-surface-variant/60 disabled:opacity-50"
          />
          <div className="flex items-center gap-1.5">
            <button 
              className="chat-input-icon-btn" 
              title="Attach chart (coming soon)"
              disabled
              aria-label="Attach file"
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
            </button>
            <button 
              className={`chat-input-icon-btn relative transition-all ${isListening ? '!text-red-500 !bg-red-500/10 !opacity-100' : ''}`} 
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Voice input"}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              aria-pressed={isListening}
            >
              {isListening && (
                <span className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              )}
              <span className="material-symbols-outlined text-base relative z-10">{isListening ? 'mic_off' : 'mic'}</span>
            </button>
            <button
              className="chat-send-btn"
              disabled={(!inputText.trim() && !isListening) || isSending || isOverLimit}
              onClick={handleSend}
              title={isSending ? "Sending..." : isOverLimit ? "Message too long" : "Send message (Enter)"}
              aria-label="Send message"
            >
              {isSending ? (
                <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
              ) : (
                <span className="material-symbols-outlined text-lg">arrow_upward</span>
              )}
            </button>
          </div>
        </div>

        {/* Character count and disclaimer */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-on-surface-variant/40 leading-relaxed font-medium">
            AI-powered guidance • For entertainment only
          </p>
          {(isNearLimit || isOverLimit) && (
            <p className={`text-[10px] font-bold ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`}>
              {charCount}/{MAX_CHARS}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
