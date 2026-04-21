'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { 
    Plus, Mic, MicOff, RotateCcw, 
    ArrowUp, Paperclip 
} from 'lucide-react';

// Generate contextual follow-up questions based on chat history
const getContextualSuggestions = (messages: ChatMessage[]): string[] => {
  if (!messages || messages.length === 0) return [];
  
  const lastMessages = messages.slice(-3);
  const lastUserMessage = lastMessages.reverse().find(m => m.type === 'user')?.text?.toLowerCase() || '';
  
  // Context-aware suggestions based on conversation topics
  const suggestionSets: Record<string, string[]> = {
    career: [
      "What's the best time for a job change?",
      "Which career suits my 10th house?",
      "When will I get a promotion?",
      "Should I start my own business?"
    ],
    relationship: [
      "When will I meet my life partner?",
      "Is this relationship compatible?",
      "What does my 7th house reveal?",
      "When is marriage favorable?"
    ],
    wealth: [
      "How can I improve my finances?",
      "When will wealth increase?",
      "Which investments are favorable?",
      "What does my 2nd house say?"
    ],
    health: [
      "What health precautions should I take?",
      "Which gemstone supports my health?",
      "When should I be careful?",
      "What does my 6th house indicate?"
    ],
    mahadasha: [
      "What's my current dasha period?",
      "When does my next dasha start?",
      "How will this dasha affect me?",
      "What remedies for this period?"
    ],
    default: [
      "What's my current planetary period?",
      "Tell me about upcoming transits",
      "What remedies do you suggest?",
      "Analyze my career prospects"
    ]
  };

  // Detect topic from last user message
  let topic = 'default';
  if (lastUserMessage.match(/career|job|work|profession|business/i)) topic = 'career';
  else if (lastUserMessage.match(/love|marriage|partner|relationship|spouse/i)) topic = 'relationship';
  else if (lastUserMessage.match(/money|wealth|finance|income|property/i)) topic = 'wealth';
  else if (lastUserMessage.match(/health|disease|illness|medical/i)) topic = 'health';
  else if (lastUserMessage.match(/mahadasha|dasha|period|antardasha/i)) topic = 'mahadasha';

  // Return 2 random suggestions from the relevant set
  const suggestions = suggestionSets[topic];
  const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
};

// Define interfaces for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const ChatInput: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isSending, activeChat, inputText, setInputText } = useChat();
  const [isListening, setIsListening] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
    const WindowSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (WindowSpeechRecognition) {
      recognitionRef.current = new WindowSpeechRecognition() as SpeechRecognition;
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => {
          const newText = prev ? `${prev} ${transcript}` : transcript;
          return newText.slice(0, MAX_CHARS);
        });
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings to use voice input.');
        } else if (event.error !== 'no-speech') {
          alert(`Voice input error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
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
    <div className="shrink-0 bg-background min-w-0 w-full overflow-hidden">
      {/* Suggested Questions - Context-aware */}
      {activeChat && activeChat.messages.length > 0 && !isSending && (
        <div className="px-3 sm:px-4 md:px-5 pt-2 pb-2 min-w-0 w-full">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0 w-full">
            {getContextualSuggestions(activeChat.messages).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(suggestion);
                  textareaRef.current?.focus();
                }}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-on-surface-variant/70 bg-surface border border-outline-variant/30 rounded-full hover:bg-surface-variant hover:border-secondary/40 hover:text-secondary transition-all whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-3 sm:px-4 md:px-5 pb-2 sm:pb-3">
        <div className={`chat-input-container transition-all ${isOverLimit ? '!border-red-500/50' : ''}`}>
          {/* Plus button on the left */}
          <button 
            className="chat-input-icon-btn shrink-0" 
            title="Attach chart (coming soon)"
            disabled
            aria-label="Attach file"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isSending}
            aria-label="Chat message input"
            className="flex-1 bg-transparent border-none outline-none text-on-surface text-[14px] font-body resize-none leading-relaxed min-h-[22px] max-h-[120px] placeholder:text-on-surface-variant/50 disabled:opacity-50 py-0.5"
          />
          
          {/* Right side buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              className={`chat-input-icon-btn relative transition-all ${isListening ? '!text-red-500 !bg-red-500/10 !opacity-100' : ''}`} 
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Voice input"}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              aria-pressed={isListening}
            >
              {isListening && (
                <span className="absolute inset-0 bg-red-500/20 rounded-lg animate-ping" />
              )}
              {isListening ? <MicOff className="w-4.5 h-4.5 relative z-10" /> : <Mic className="w-4.5 h-4.5 relative z-10" />}
            </button>
            
            {inputText.trim() ? (
              <button
                className="chat-send-btn"
                disabled={isSending || isOverLimit}
                onClick={handleSend}
                title={isSending ? "Sending..." : isOverLimit ? "Message too long" : "Send message"}
                aria-label="Send message"
              >
                {isSending ? (
                  <RotateCcw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <ArrowUp className="w-4.5 h-4.5" />
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Compact disclaimer with character count */}
        <div className="flex items-center justify-center gap-2 mt-1 px-1">
          <p className="text-[9px] text-on-surface-variant/35 leading-tight font-medium text-center">
            AI guidance • Entertainment only
            {(isNearLimit || isOverLimit) && (
              <span className={`ml-2 font-bold ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
