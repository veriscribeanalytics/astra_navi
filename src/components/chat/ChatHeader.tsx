'use client';

import React from 'react';

interface ChatHeaderProps { }

const ChatHeader: React.FC<ChatHeaderProps> = () => {
  return (
    <div className="chat-main-header">
      <div className="flex items-center gap-2.5">
        {/* AI Avatar */}
        <div className="w-9 h-9 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-base">
          ✦
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Navi — AI Astrologer</p>
          <p className="text-[11px] text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Online · Vedic + Western · Responds instantly
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="chat-header-btn">
          <span className="material-symbols-outlined text-sm">share</span>
          Share
        </button>
        <button className="chat-header-btn">
          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
          Export PDF
        </button>
        <button className="chat-header-btn-gold">
          View full Kundli ✦
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
