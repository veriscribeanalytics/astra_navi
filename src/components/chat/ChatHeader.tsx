'use client';

import React, { useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';
import { Info, History, X, Settings, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks';
import AvatarPicker, { type AvatarPickerHandle } from './AvatarPicker';

const ChatHeader: React.FC = () => {
  const { t } = useTranslation();
  const { activeChat, setIsMobileMenuOpen, setIsRightPanelOpen, isMobileMenuOpen, isRightPanelOpen } = useChat();
  const router = useRouter();
  const pickerRef = useRef<AvatarPickerHandle>(null);

  const showSwipeHint = !isMobileMenuOpen && !isRightPanelOpen;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="chat-main-header">
      {showSwipeHint && (
        <div className="swipe-hint lg:hidden" aria-hidden="true" />
      )}

      {/* Back zone — same width as the sidebar on desktop */}
      <div className="chat-header-back-zone">
        <button
          onClick={handleBack}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 bg-secondary/8 text-secondary hover:bg-secondary/15 transition-all"
          aria-label={t('chat.header.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-semibold hidden sm:inline">{t('chat.header.back')}</span>
        </button>
      </div>

      {/* Main zone — aligned with the main chat column */}
      <div className="chat-header-main-zone">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="chat-header-btn lg:hidden -ml-1 text-foreground/50 hover:text-secondary transition-all"
            aria-label={t('chat.header.viewHistory')}
          >
            <History className="w-4 h-4" />
          </button>
          <AvatarPicker ref={pickerRef} />
          {activeChat?.title && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1 h-1 bg-foreground/15 rounded-full" />
              <p className="chat-title-text text-[12px] text-foreground/35 truncate max-w-[35vw] sm:max-w-[180px]">{activeChat.title}</p>
            </div>
          )}
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1 shrink-0" />
          <span className="text-[11px] text-foreground/30 hidden md:inline shrink-0">{t('chat.header.online')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => pickerRef.current?.toggle()}
            className="chat-header-btn text-foreground/40 hover:text-secondary transition-colors rounded-lg"
            aria-label={t('chat.avatarPicker.chooseGuide')}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="chat-header-btn text-foreground/40 hover:text-secondary transition-colors rounded-lg"
            aria-label={t('chat.header.viewChartContext')}
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="chat-header-btn lg:hidden -mr-1 text-foreground/50 hover:text-secondary transition-all"
            aria-label={t('chat.header.closeChat')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
