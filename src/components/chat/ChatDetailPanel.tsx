'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { X, Lock, Star, Pencil, Sparkles, MessageSquare, User, Hash, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import KundliSvg from '@/components/ui/astrology/KundliSvg';
import { useFocusTrap, useTranslation, useChatSummary } from '@/hooks';

const ChatDetailPanel: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    activeChat, setIsRightPanelOpen, isGuest 
  } = useChat();
  const { data: summaryData, isLoading: isSummaryLoading } = useChatSummary(activeChat?.id ?? null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const chartModalRef = useFocusTrap<HTMLDivElement>(isChartModalOpen);
  const { t } = useTranslation();

  const profileFields: [string, string][] = [
    [t('chat.detail.moonSign'), user?.moonSign || t('chat.detail.notSet')],
    [t('chat.detail.sunSign'), user?.sunSign || t('chat.detail.notSet')],
    [t('chat.detail.lagna'), user?.lagnaSign || t('chat.detail.notSet')],
    [t('chat.detail.birthDate'), user?.dob || t('chat.detail.notSet')],
    [t('chat.detail.birthTime'), user?.tob || t('chat.detail.notSet')],
    [t('chat.detail.birthPlace'), user?.pob || t('chat.detail.notSet')],
  ];

  useEffect(() => {
    if (!isChartModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsChartModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChartModalOpen]);

  return (
    <>
      <div className="relative">
        {isGuest && (
          <div className="absolute inset-0 z-50 backdrop-blur-[2px] bg-surface/40 flex flex-col items-center justify-center p-4 text-center rounded-xl">
            <Lock className="w-8 h-8 text-secondary/40 mb-2" />
            <p className="text-[10px] font-bold text-primary">{t('chat.detail.identityRequired')}</p>
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[12px] font-bold text-secondary uppercase tracking-[0.18em]">{t('chat.detail.chartContext')}</p>
          <button 
            onClick={() => setIsRightPanelOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant/45 hover:bg-surface-variant/30 hover:text-on-surface transition-colors"
            aria-label={t('chat.detail.closeChartContext')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[18px] font-bold text-foreground/85">
            {user?.name || user?.email?.split('@')[0] || t('chat.detail.notSet')}
          </p>
          <button 
            onClick={() => router.push('/profile')}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold text-secondary/70 hover:bg-secondary/10 hover:text-secondary transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> {t('chat.detail.edit')}
          </button>
        </div>

        <div className="mb-7 flex justify-center">
          <button
            type="button"
            onClick={() => setIsChartModalOpen(true)}
            className="group relative flex aspect-square w-full max-w-[260px] items-center justify-center rounded-2xl border border-secondary/15 bg-background/25 shadow-[0_0_28px_rgba(200,136,10,0.08)] transition-all hover:border-secondary/35 hover:bg-secondary/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
            aria-label={t('chat.detail.openLargerBirthChart')}
          >
            <div className="absolute inset-0 rounded-2xl bg-secondary/[0.03]" />
            <KundliSvg className="relative h-full w-full text-secondary opacity-80 brightness-125 contrast-125" />
            <span className="absolute bottom-3 rounded-full border border-secondary/20 bg-background/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary/80 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {t('chat.detail.view')}
            </span>
          </button>
        </div>

        <div className="space-y-1">
          {profileFields.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-outline-variant/7 py-2.5 last:border-b-0">
              <span className="text-[13px] font-medium text-foreground/35">{label}</span>
              <span className={`min-w-0 text-right text-[13px] font-bold leading-snug break-words ${value === t('chat.detail.notSet') ? 'text-foreground/20' : 'text-foreground/75'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {activeChat && (
        <div className="mt-8 border-t border-outline-variant/10 pt-5">
          <p className="mb-4 text-[12px] font-bold text-secondary uppercase tracking-[0.18em]">{t('chat.detail.chatRating')}</p>
          {activeChat.averageRating != null ? (
            <div className="flex items-center justify-center gap-1">
              {Array(Math.floor(activeChat.averageRating)).fill(0).map((_, i) => (
                <Star key={i} size={12} className="fill-secondary text-secondary" />
              ))}
              {activeChat.averageRating - Math.floor(activeChat.averageRating) >= 0.5 && (
                <Star size={12} className="fill-secondary/50 text-secondary" />
              )}
              {Array(5 - Math.ceil(activeChat.averageRating)).fill(0).map((_, i) => (
                <Star key={i} size={12} className="text-foreground/10 fill-transparent" />
              ))}
              <span className="text-[10px] text-foreground/30 ml-1">{activeChat.averageRating.toFixed(1)}/5</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant/10 bg-background/20 px-4 py-5 text-center">
              <Sparkles className="h-4 w-4 text-secondary/50" />
              <p className="text-[12px] text-foreground/30">{t('chat.detail.rateResponsesToSeeAverage')}</p>
            </div>
          )}
        </div>
      )}

      {activeChat && activeChat.messages.length > 1 && (
        <div className="mt-6 border-t border-outline-variant/10 pt-5">
          <p className="mb-3 text-[12px] font-bold text-secondary uppercase tracking-[0.18em]">{t('chat.detail.conversationStats')}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-outline-variant/10 bg-background/20 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-foreground/30 mb-1">
                <MessageSquare size={11} />
                <span className="text-[10px] uppercase tracking-wider">{t('chat.detail.messages')}</span>
              </div>
              <p className="text-[15px] font-bold text-foreground/70">{activeChat.messages.length}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/10 bg-background/20 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-foreground/30 mb-1">
                <User size={11} />
                <span className="text-[10px] uppercase tracking-wider">{t('chat.detail.questions')}</span>
              </div>
              <p className="text-[15px] font-bold text-foreground/70">
                {activeChat.messages.filter(m => m.type === 'user').length}
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/10 bg-background/20 px-3 py-2.5 col-span-2">
              <div className="flex items-center gap-1.5 text-foreground/30 mb-1">
                <Hash size={11} />
                <span className="text-[10px] uppercase tracking-wider">{t('chat.detail.topics')}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(() => {
                  const topics = activeChat.messages
                    .filter(m => m.topic && m.topic !== 'general')
                    .map(m => m.topic as string);
                  const unique = [...new Set(topics)];
                  return unique.length > 0 ? unique.slice(0, 4).map(t => (
                    <span key={t} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-medium capitalize">{t}</span>
                  )) : <span className="text-[10px] text-foreground/20">{t('chat.detail.noTopicsYet')}</span>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeChat && activeChat.messages.length > 1 && (
        <div className="mt-6 border-t border-outline-variant/10 pt-5">
          <p className="mb-3 text-[12px] font-bold text-secondary uppercase tracking-[0.18em] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {t('chat.detail.chatSummary')}
          </p>
          {isSummaryLoading ? (
            <p className="text-[12px] text-foreground/30 italic">{t('chat.detail.summaryLoading')}</p>
          ) : summaryData ? (
            <div className="rounded-xl border border-outline-variant/10 bg-background/20 px-3 py-2.5">
              <p className="text-[13px] text-foreground/60 leading-relaxed">{summaryData.summary}</p>
              {summaryData.topicsDiscussed.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {summaryData.topicsDiscussed.slice(0, 4).map(topic => (
                    <span key={topic} className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-medium capitalize">{topic}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-foreground/30">{t('chat.detail.noSummaryYet')}</p>
          )}
        </div>
      )}

      {isChartModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={chartModalRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t('chat.detail.expandedBirthChart')}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsChartModalOpen(false);
            }
          }}
        >
          <div className="relative flex max-h-[92dvh] w-full max-w-[min(92vw,820px)] flex-col rounded-2xl border border-secondary/20 bg-background shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant/15 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{t('chat.detail.birthChart')}</p>
                <p className="truncate text-[15px] font-bold text-foreground/80">
                  {user?.name || user?.email?.split('@')[0] || t('chat.detail.chart')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChartModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant/55 hover:bg-surface-variant/30 hover:text-on-surface transition-colors"
                aria-label={t('chat.detail.closeExpandedChart')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
              <div className="flex aspect-square w-full max-w-[min(84vw,680px,76dvh)] items-center justify-center rounded-2xl border border-secondary/15 bg-surface/20 p-2">
                <KundliSvg className="h-full w-full text-secondary opacity-95 brightness-125 contrast-125" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatDetailPanel;
