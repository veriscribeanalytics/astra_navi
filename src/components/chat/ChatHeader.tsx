'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';
import { Info, History, X } from 'lucide-react';

const ChatHeader: React.FC = () => {
  const { setIsMobileMenuOpen, setIsRightPanelOpen } = useChat();
  const router = useRouter();

  return (
    <div className="chat-main-header">
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile History Toggle (Left most) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(true);
          }}
          className="lg:hidden p-1.5 -ml-2 text-primary/80 hover:text-secondary transition-all active:scale-95"
          aria-label="View history"
        >
          <History className="w-6 h-6" />
        </button>

        {/* AI Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm sm:text-base">
          ✦
        </div>
        <div>
          <p className="text-sm font-headline font-bold text-on-surface truncate max-w-[120px] sm:max-w-none">Navi — AI Astrologer</p>
          <p className="text-[10px] sm:text-[11px] text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            <span className="hidden xs:inline">Online · Responds instantly</span>
            <span className="xs:hidden">Online</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2 items-center">
        {/* Info Toggle for Right Sidebar - HIDDEN ON MOBILE AS REQUESTED */}
        <button 
          onClick={() => setIsRightPanelOpen(true)}
          className="hidden xl:flex p-1.5 text-secondary/70 hover:text-secondary transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* Mobile Close/Back Button (Right most) */}
        <button 
          onClick={() => router.push('/')}
          className="lg:hidden p-1.5 -mr-2 text-primary/80 hover:text-secondary transition-all active:scale-95"
          aria-label="Close chat"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
