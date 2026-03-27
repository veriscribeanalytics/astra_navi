'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';

const suggestedPrompts = [
  'When should I get married?',
  'Best muhurat for property purchase',
  'What does my 7th house say about relationships?',
  'Jupiter transit effects on me',
];

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<'Vedic' | 'Western' | 'Both'>('Vedic');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);

  return (
    <div className="shrink-0 bg-background border-t border-outline-variant/10">
      {/* Suggested Prompts */}
      <div className="px-5 pt-3 pb-1.5 flex gap-2 flex-wrap">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setMessage(prompt)}
            className="text-[11px] text-on-surface-variant/60 bg-surface/50 border border-outline-variant/15 px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap hover:bg-surface-variant/50 hover:border-outline-variant/30 hover:text-on-surface-variant transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-5 pt-2 pb-4">
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Navi anything about your chart, transits, timing, or remedies..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-on-surface text-[13px] font-body resize-none leading-relaxed min-h-[20px] max-h-[100px] placeholder:text-on-surface-variant/30"
          />
          <div className="flex items-center gap-1.5">
            <button className="chat-input-icon-btn" title="Attach chart">
              <span className="material-symbols-outlined text-base">attach_file</span>
            </button>
            <button className="chat-input-icon-btn" title="Voice input">
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
            <button className="chat-send-btn" disabled={!message.trim()}>
              <span className="material-symbols-outlined text-lg">arrow_upward</span>
            </button>
          </div>
        </div>

        {/* Bottom Meta */}
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <span className="text-[10px] text-on-surface-variant/25">
            Navi reads your saved birth chart automatically
          </span>
          <div className="flex gap-1.5">
            {(['Vedic', 'Western', 'Both'] as const).map((mode) => (
              <Button
                key={mode}
                onClick={() => setActiveMode(mode)}
                variant={activeMode === mode ? 'primary' : 'ghost'}
                className={`!px-2.5 !py-1 !font-bold !text-[9px] !h-auto uppercase tracking-wider ${
                  activeMode !== mode ? '!text-on-surface-variant/40 !border-outline-variant/10 hover:!text-on-surface-variant/60' : ''
                }`}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
