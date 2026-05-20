'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';
import { Info, History, X } from 'lucide-react';
import AvatarPicker from './AvatarPicker';

const ChatHeader: React.FC = () => {
  const { activeChat, setIsMobileMenuOpen, setIsRightPanelOpen, isMobileMenuOpen, isRightPanelOpen } = useChat();
  const router = useRouter();

  const showSwipeHint = !isMobileMenuOpen && !isRightPanelOpen;

  return (
    <div className="chat-main-header">
      {showSwipeHint && (
        <div className="swipe-hint lg:hidden" aria-hidden="true" />
      )}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="chat-header-btn lg:hidden -ml-1 text-foreground/50 hover:text-secondary transition-all"
          aria-label="View history"
        >
          <History className="w-4 h-4" />
        </button>
        <AvatarPicker />
        {activeChat?.title && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1 h-1 bg-foreground/15 rounded-full" />
            <p className="chat-title-text text-[12px] text-foreground/35 truncate max-w-[35vw] sm:max-w-[180px]">{activeChat.title}</p>
          </div>
        )}
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1 shrink-0" />
        <span className="text-[11px] text-foreground/30 hidden md:inline shrink-0">Online</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsRightPanelOpen(true)}
          className="chat-header-btn text-foreground/40 hover:text-secondary transition-colors rounded-lg"
          aria-label="View chart context"
        >
          <Info className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push('/')}
          className="chat-header-btn lg:hidden -mr-1 text-foreground/50 hover:text-secondary transition-all"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;