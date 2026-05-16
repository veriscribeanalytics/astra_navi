'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ChatDetailPanel from '@/components/chat/ChatDetailPanel';
import PaywallCard from '@/components/paywall/PaywallCard';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks';

import { useAuth } from '@/context/AuthContext';
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from '@/utils/personalizedQuestions';

const ChatPageClient: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen, 
    activeChat, isLoadingMessages, createNewChat, selectChat, isGuest, isGuestExpired, guestTimeRemaining, enableGuestMode,
    paywall, clearPaywall
    } = useChat();

  React.useEffect(() => {
    if (isLoading) return;

    if (!user?.email) {
      const mode = searchParams.get('mode');
      if (mode === 'guest') {
        enableGuestMode();
        return;
      }
      router.push('/login?callbackUrl=/chat');
      return;
    }

    const chatId = searchParams.get('id');
    if (chatId) {
      selectChat(chatId);
      return;
    }

    const pendingMsg = localStorage.getItem('astranavi_pending_message');
    if (pendingMsg && pendingMsg.trim()) {
      localStorage.removeItem('astranavi_pending_message');
      createNewChat(pendingMsg);
    }
  }, [user, searchParams, createNewChat, selectChat, enableGuestMode, router, isLoading]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewChat();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [createNewChat]);

  const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
  const ageBracket = useMemo(() => getAgeBracket(age), [age]);
  const suggestedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);

  const handleQuestionClick = (question: string) => {
    createNewChat(question);
  };

  const closeOverlays = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMobileMenuOpen(false);
      setIsRightPanelOpen(false);
    }
  };

  const isEmptyChat = !activeChat && !isLoadingMessages;

  return (
    <div className="chat-layout relative overflow-hidden">
      {isGuest && (
        <div className={`absolute top-0 left-0 right-0 z-[100] min-h-10 px-3 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 shadow-lg border-b border-white/10 ${isGuestExpired ? 'bg-red-500/90' : 'bg-amber-500/90'} backdrop-blur-md`}>
          <div className="text-white text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] flex items-center gap-2 text-center">
            {isGuestExpired ? t('chat.guestExpired') : t('chat.guestPreviewMode')}
            {!isGuestExpired && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-mono tabular-nums">
                {Math.floor(guestTimeRemaining / 60)}:{String(guestTimeRemaining % 60).padStart(2, '0')}
              </span>
            )}
          </div>
          <a href="/login" className="px-3 py-1 bg-white text-amber-600 rounded-full text-[10px] font-bold hover:bg-gray-100 transition-colors shadow-sm">{t('chat.guestLoginNow')}</a>
        </div>
      )}

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-secondary/[0.02] rounded-full blur-[150px] pointer-events-none" />

      <div className={`sidebar-overlay ${(isMobileMenuOpen || isRightPanelOpen) ? 'active' : ''}`} onClick={closeOverlays} />

      <div className={`chat-left-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <ChatSidebar />
      </div>

      <div className={`chat-main-area relative z-10 ${isGuest ? 'pt-12 sm:pt-10' : ''}`}>
        <ChatHeader />
        {isEmptyChat ? (
          <div className="chat-empty-center">
            <div className="flex flex-col items-center w-full gap-6 mb-4">
              <div className="chat-empty-icon w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="chat-empty-greeting text-xl sm:text-2xl 3xl:text-[28px] font-headline font-bold text-on-surface/80 tracking-tight text-center">
                {t('chat.emptyGreeting')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-2 gap-3 w-full mb-6">
              {suggestedQuestions.slice(0, 4).map((question, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  onClick={() => handleQuestionClick(question)}
                  className="ripple-btn text-left text-[14px] 3xl:text-[16px] text-on-surface-variant/70 bg-surface/60 border border-outline-variant/20 px-5 py-3.5 rounded-xl hover:border-secondary/30 hover:text-secondary hover:bg-surface/90 transition-all"
                  aria-label={`Ask: ${question}`}
                >
                  {question}
                </motion.button>
              ))}
            </div>
            <div className="w-full">
              <ChatInput />
            </div>
          </div>
        ) : (
          <div className="chat-center-column">
            <ChatMessages />
            <ChatInput />
          </div>
        )}
      </div>

      {paywall && !paywall.isSoft && (
        <PaywallCard paywall={paywall} variant="modal" onClose={clearPaywall} />
      )}

      <div className={`chat-right-sidebar ${isRightPanelOpen ? 'mobile-open' : ''}`}>
        <ChatDetailPanel />
      </div>
    </div>
  );
};

export default ChatPageClient;
