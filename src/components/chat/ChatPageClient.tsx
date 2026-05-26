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
import { Sparkles, Sun, Briefcase, Orbit, Heart, Compass, Star, Gem, ChevronRight, Shield } from 'lucide-react';
import { useTranslation, useTransitsToday, useSwipeDrawer, useAvatarTheme } from '@/hooks';

import { useAuth } from '@/context/AuthContext';
import { getAvatarStarterCards, type StarterIconKey } from '@/utils/personalizedQuestions';
import { getAvatarImage } from '@/utils/avatarStyle';

const STARTER_ICONS: Record<StarterIconKey, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  briefcase: Briefcase,
  orbit: Orbit,
  heart: Heart,
  compass: Compass,
  sparkles: Sparkles,
  star: Star,
  gem: Gem,
};

const ChatPageClient: React.FC = () => {
  const { user, isLoading, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const { data: transitsData, isLoading: isTransitsLoading } = useTransitsToday();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen,
    activeChat, isLoadingMessages, createNewChat, selectChat, isGuest, isGuestExpired, guestTimeRemaining, enableGuestMode,
    paywall, clearPaywall, selectedAvatarId, avatars, setSelectedAvatarId
    } = useChat();

  const currentAvatar = useMemo(() => {
    return avatars.find(a => a.avatarId === selectedAvatarId);
  }, [avatars, selectedAvatarId]);

  useAvatarTheme(selectedAvatarId, currentAvatar);

  const imgSrc = getAvatarImage(selectedAvatarId);

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

    const guide = searchParams.get('guide');
    if (guide) {
      setSelectedAvatarId(guide);
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
  }, [user, isLoggedIn, searchParams, createNewChat, selectChat, enableGuestMode, router, isLoading, setSelectedAvatarId]);

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

  const starterCards = useMemo(() => getAvatarStarterCards(selectedAvatarId, t), [selectedAvatarId, t]);

  // Map transit-driven suggestions onto the card layout when present (keeps freshness without losing the new UI).
  const heroCards = useMemo(() => {
    const transitQuestions = transitsData?.suggestedQuestions;
    if (transitQuestions && transitQuestions.length >= 4) {
      return starterCards.map((card, idx) => ({
        ...card,
        description: transitQuestions[idx] ?? card.description,
        question: transitQuestions[idx] ?? card.question,
      }));
    }
    return starterCards;
  }, [starterCards, transitsData?.suggestedQuestions]);

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

      <ChatHeader />

      <div className="chat-body">
        <div className={`chat-left-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ChatSidebar />
        </div>

        <div className={`chat-main-area relative z-10 ${isGuest ? 'pt-12 sm:pt-10' : ''}`} {...bindGestures}>
          {isEmptyChat ? (
          <div className="chat-empty-shell">
            <div className="chat-empty-hero">
              {/* Cosmic avatar */}
              <div className="relative w-[136px] h-[136px] sm:w-[160px] sm:h-[160px] mb-5 sm:mb-6 shrink-0">
                <div className="absolute inset-0 rounded-full bg-secondary/20 blur-2xl" aria-hidden />
                <div className="absolute inset-0 rounded-full border border-secondary/30" aria-hidden />
                <div className="absolute inset-1.5 rounded-full border border-secondary/15" aria-hidden />
                <div className="absolute inset-3 rounded-full overflow-hidden border-2 border-secondary/40 bg-surface shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={currentAvatar?.name ?? 'Navi'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                </div>
                {/* Floating sparkles */}
                <Sparkles className="absolute top-0 right-2 w-3 h-3 text-secondary/80" aria-hidden />
                <Sparkles className="absolute bottom-3 left-1 w-2.5 h-2.5 text-secondary/60" aria-hidden />
                <Sparkles className="absolute top-1/2 -right-1 w-3 h-3 text-secondary/70" aria-hidden />
              </div>

              {/* Pill badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
                <Sparkles className="w-3 h-3 text-secondary" />
                <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-secondary">
                  {currentAvatar?.title ?? t('chat.empty.badge')}
                </span>
              </div>

              {/* Personal greeting (per-avatar) */}
              {currentAvatar?.name && (
                <p className="text-[13px] sm:text-[14px] font-semibold text-foreground/70 mb-1.5 text-center">
                  {t('chat.empty.greeting', { name: currentAvatar.name })}
                </p>
              )}

              {/* Heading */}
              <h1 className="text-2xl sm:text-3xl 3xl:text-4xl font-headline font-bold text-foreground/90 tracking-tight text-center max-w-[18ch] mb-3">
                {t('chat.empty.headingLead')}{' '}
                <span className="text-secondary italic">{t('chat.empty.headingAccent')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[13px] sm:text-[14px] text-foreground/45 max-w-[44ch] leading-relaxed text-center mb-1">
                {currentAvatar?.description ?? t('chat.empty.subtitle')}
              </p>

              {/* Today's energy ribbon (if available) */}
              {transitsData?.todayEnergy && (
                <p className="text-[12px] text-secondary/70 max-w-[40ch] leading-relaxed text-center italic mt-1 mb-3">
                  {transitsData.todayEnergy}
                </p>
              )}
              {isTransitsLoading && !transitsData && (
                <p className="text-[12px] text-foreground/30 italic mt-1 mb-3">
                  {t('chat.detail.todayEnergyLoading')}
                </p>
              )}

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full mt-5 sm:mt-6">
                {heroCards.slice(0, 4).map((card, idx) => {
                  const Icon = STARTER_ICONS[card.icon] ?? Sparkles;
                  return (
                    <motion.button
                      key={`${card.title}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.08 }}
                      onClick={() => handleQuestionClick(card.question)}
                      className="group flex items-center gap-3 px-4 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-surface/80 border border-outline-variant/20 text-left hover:border-secondary/40 hover:bg-surface transition-all"
                      aria-label={`Ask: ${card.question}`}
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center text-secondary shrink-0 group-hover:bg-secondary/15 group-hover:border-secondary/30 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] sm:text-[14px] font-bold text-secondary leading-tight">
                          {card.title}
                        </p>
                        <p className="text-[11px] sm:text-[12px] text-foreground/50 leading-snug mt-0.5 line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-secondary shrink-0 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="chat-empty-footer">
              <ChatInput />
              <div className="flex items-center justify-center gap-1.5 mt-2 text-foreground/30 text-[11px]">
                <Shield className="w-3 h-3" />
                <span>{t('chat.empty.dataPrivate')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-center-column">
            <ChatMessages />
            <ChatInput />
          </div>
        )}
        </div>
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
