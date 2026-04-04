'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';

const ChatInput: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isSending, activeChat, inputText, setInputText } = useChat();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
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

  // Don't show input if no active chat
  if (!activeChat) return null;

  return (
    <div className="shrink-0 bg-background border-t border-outline-variant/10">

      {/* Input Area */}
      <div className="px-5 pt-2 pb-4">
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Navi anything about your chart, transits, timing, or remedies..."
            rows={1}
            disabled={isSending}
            className="flex-1 bg-transparent border-none outline-none text-on-surface text-[13px] font-body resize-none leading-relaxed min-h-[20px] max-h-[100px] placeholder:text-on-surface-variant/30 disabled:opacity-50"
          />
          <div className="flex items-center gap-1.5">
            <button className="chat-input-icon-btn" title="Attach chart">
              <span className="material-symbols-outlined text-base">attach_file</span>
            </button>
            <button className="chat-input-icon-btn" title="Voice input">
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
            <button
              className="chat-send-btn"
              disabled={!inputText.trim() || isSending}
              onClick={handleSend}
            >
              <span className="material-symbols-outlined text-lg">arrow_upward</span>
            </button>
          </div>
        </div>

        {/* Bottom Meta — Vedic/Western/Both buttons REMOVED */}
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <span className="text-[10px] text-on-surface-variant/25 hidden xs:block">
            Navi reads your saved birth chart automatically
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
