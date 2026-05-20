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
import { useTranslation, useTransitsToday, useSwipeDrawer, useAvatarTheme } from '@/hooks';

import { useAuth } from '@/context/AuthContext';
import { calculateAge, getAgeBracket, getAvatarQuestions } from '@/utils/personalizedQuestions';
import { getAvatarImage } from '@/utils/avatarStyle';

const ChatPageClient: React.FC = () => {
  const { user, isLoading, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const { data: transitsData, isLoading: isTransitsLoading } = useTransitsToday();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen,
    activeChat, isLoadingMessages, createNewChat, selectChat, isGuest, isGuestExpired, guestTimeRemaining, enableGuestMode,
    paywall, clearPaywall, selectedAvatarId, avatars
    } = useChat();

  useAvatarTheme(selectedAvatarId);

  const currentAvatar = useMemo(() => {
    return avatars.find(a => a.avatarId === selectedAvatarId);
  }, [avatars, selectedAvatarId]);

  const avatarName = currentAvatar?.name ?? 'Navi';

  const imgSrc = getAvatarImage(selectedAvatarId);

  const greetingText = useMemo(() => {
    const id = selectedAvatarId ?? 'navi';
    const intro = t(`chat.avatarIntros.${id}`);
    return `Hi, I'm ${avatarName}. ${intro}`;
  }, [selectedAvatarId, avatarName, t]);

  const { bindGestures } = useSwipeDrawer({
    onOpenLeft: () => setIsMobileMenuOpen(true),
    onOpenRight: () => setIsRightPanelOpen(true),
    onCloseLeft: () => setIsMobileMenuOpen(false),
    onCloseRight: () => setIsRightPanelOpen(false),
  });

  React.useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      const mode = searchParams.get('mode');
      if (mode === 'guest') {
        enableGuestMode();
        return;
      }
      router.push('/login?callbackUrl=/chat');
      return;
    }

    if (!user?.email) return;

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
  }, [user, isLoggedIn, searchParams, createNewChat, selectChat, enableGuestMode, router, isLoading]);

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
  const suggestedQuestions = useMemo(() => {
    const transitQuestions = transitsData?.suggestedQuestions;
    if (transitQuestions && transitQuestions.length >= 4) return transitQuestions.slice(0, 4);
    return getAvatarQuestions(selectedAvatarId, ageBracket);
  }, [ageBracket, transitsData?.suggestedQuestions, selectedAvatarId]);

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

      {/* Avatar ambient glow — scales with theme color */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[60vh] rounded-full blur-[120px] opacity-20 bg-secondary transition-[background-color] duration-700" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50vw] h-[50vh] rounded-full blur-[100px] opacity-10 bg-secondary transition-[background-color] duration-700" />
        <div className="absolute top-1/2 left-[-5%] w-[30vw] h-[40vh] rounded-full blur-[80px] opacity-8 bg-secondary transition-[background-color] duration-700" />
      </div>

      <div className={`sidebar-overlay ${(isMobileMenuOpen || isRightPanelOpen) ? 'active' : ''}`} onClick={closeOverlays} />

      <div className={`chat-left-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <ChatSidebar />
      </div>

      <div className={`chat-main-area relative z-10 ${isGuest ? 'pt-12 sm:pt-10' : ''}`} {...bindGestures}>
        <ChatHeader />
        {isEmptyChat ? (
          <div className="chat-empty-center">
            <div className="flex flex-col items-center w-full gap-4 sm:gap-6 mb-4">
              <div className="chat-empty-icon w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-xl overflow-hidden">
                {imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgSrc}
                    alt={currentAvatar?.name ?? 'Navi'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <h2 className="chat-empty-greeting text-lg sm:text-xl 3xl:text-[28px] font-headline font-bold text-on-surface/80 tracking-tight text-center">
                {greetingText}
              </h2>
              {transitsData?.todayEnergy && (
                <p className="text-center text-[13px] text-on-surface-variant/40 max-w-[32ch] leading-relaxed italic">
                  {transitsData.todayEnergy}
                </p>
              )}
              {isTransitsLoading && !transitsData && (
                <p className="text-center text-[13px] text-on-surface-variant/30 italic">{t('chat.detail.todayEnergyLoading')}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 3xl:grid-cols-2 gap-3 w-full mb-4 sm:mb-6">
              {suggestedQuestions.slice(0, 4).map((question, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  onClick={() => handleQuestionClick(question)}
                  className="ripple-btn text-left text-[14px] 3xl:text-[16px] text-on-surface-variant/70 bg-surface/60 border border-outline-variant/20 px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl hover:border-secondary/30 hover:text-secondary hover:bg-surface/90 transition-all"
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
