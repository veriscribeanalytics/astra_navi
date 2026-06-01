'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'isomorphic-dompurify';
import { parseMarkdown, autoFormatAstrology } from '@/utils/markdownParser';
import Card from '@/components/ui/Card';
import RatingMeter from '@/components/ui/RatingMeter';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import FeedbackModal from './FeedbackModal';
import { formatRelativeTime, formatDisplayDateTime } from '@/lib/datetime';
import { useToast, useTranslation } from '@/hooks';
import { Volume2, Copy, ChevronRight, RefreshCw, Check, AlertCircle, ArrowDown, Image, FileText, Pencil, Trash2, Pin, PinOff, Search, X, ChevronUp, Heart, Loader2 } from 'lucide-react';
import { getAvatarIcon, getAvatarAccent, getAvatarImage } from '@/utils/avatarStyle';
import { bandPalette } from '@/lib/familyStatus';

const sanitizedHtmlCache = new Map<string, string>();

function getSanitizedHtml(msgId: string, mainText: string): string {
  const cacheKey = msgId + '\0' + mainText;
  const cached = sanitizedHtmlCache.get(cacheKey);
  if (cached) return cached;
  const html = DOMPurify.sanitize(parseMarkdown(autoFormatAstrology(mainText)));
  sanitizedHtmlCache.set(cacheKey, html);
  return html;
}

const SystemBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center my-1">
    <span className="inline-block text-[13px] text-on-surface-variant/40 px-3 py-0.5">
      {text}
    </span>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="flex-1 px-4 sm:px-5 py-5 flex flex-col gap-4">
    <div className="h-6 w-64 mx-auto rounded-full bg-surface-variant/30" />
    <div className="flex gap-2.5 items-start max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-surface-variant/40 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-variant/30" />
        <div className="h-20 rounded-xl bg-surface-variant/20" />
      </div>
    </div>
  </div>
);

const quickReplyOptions = [
  'Tell me more',
  'What remedies?',
  'How long will this last?',
  'Next question',
];

const topicSuggestions: Record<string, string[]> = {
  career: ['What career changes should I prepare for?', 'Is this a good time for a job change?', 'What are my professional strengths?', 'Which dasha supports my career growth?'],
  love: ['How can I improve my relationship?', 'When will I meet my partner?', 'What does my chart say about compatibility?', 'Is marriage favorable for me?'],
  finance: ['What is my wealth potential?', 'How should I invest this period?', 'When will my finances improve?', 'What yogas indicate financial success?'],
  health: ['What remedies can boost my vitality?', 'How do transits affect my health?', 'What should I focus on for well-being?', 'Are there health concerns in my chart?'],
  timing: ['What muhurat is best for this?', 'When will this situation improve?', 'What should I avoid during this period?', 'How long will this phase last?'],
  remedy: ['What remedies does my chart suggest?', 'Which gemstone would benefit me?', 'What mantras should I recite?', 'What donations would help my situation?'],
  study: ['How can I improve my focus?', 'What field of study suits my chart?', 'Is this a good time for exams?', 'What career should I pursue?'],
  general: ['What should my priority be right now?', 'How can I understand my chart better?', 'What transits are affecting me?', 'What does my dasha period say?'],
};

const intentCompletions: Record<string, string> = {
  greeting: 'What would you like to explore about your chart today?',
  yes_no: 'Can you elaborate further on that?',
  timing: 'How does my current dasha influence this?',
  comparison: 'Can you compare this with similar periods from my chart?',
  advice: 'What would the classical texts suggest in this situation?',
  topic_overview: 'Can you dive deeper into this topic?',
  deep_analysis: 'What are the planetary reasons behind this?',
  emotional_support: 'What remedies can bring me peace during this time?',
  remedy_request: 'Are there additional remedies I should consider?',
  explanation: 'How does this relate to my specific chart?',
};

const haptic = (light?: boolean) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(light ? 5 : 10);
  }
};

const DEFAULT_THINKING_STATUSES = [
  'chat.thinkingReadingChart',
  'chat.thinkingConsultingStars',
  'chat.thinkingInterpretingTransits',
  'chat.thinkingAligningPlanetaryData',
];

const FAMILY_THINKING_STATUSES = [
  'chat.thinkingFamilyLookingUp',
  'chat.thinkingFamilyChecking',
];

const getThinkingStatuses = (tools?: string[]): string[] =>
  tools && tools.length > 0 ? FAMILY_THINKING_STATUSES : DEFAULT_THINKING_STATUSES;

const ThinkingIndicator: React.FC = () => {
  const [statusIdx, setStatusIdx] = useState(0);
  const { t } = useTranslation();
  const { selectedAvatarId, avatars, thinkingData } = useChat();

  const statuses = getThinkingStatuses(thinkingData?.tools);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % statuses.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [statuses.length]);

  // Reset index when the bucket of statuses changes so we don't index past the end.
  useEffect(() => {
    setStatusIdx(0);
  }, [statuses]);

  const currentAvatar = avatars.find(a => a.avatarId === selectedAvatarId);
  const accent = selectedAvatarId && selectedAvatarId !== 'navi' ? getAvatarAccent(selectedAvatarId) : '';
  const avatarName = currentAvatar?.name ?? 'Navi';
  const statusText = t(statuses[statusIdx]);
  const lowerStatusText = statusText.charAt(0).toLowerCase() + statusText.slice(1);
  const thinkingText = `${avatarName} is ${lowerStatusText}`;

  return (
    <div className="flex gap-3 items-start mt-4 mb-2">
      <div className={`ai-avatar overflow-hidden ${accent}`}>
        {getAvatarImage(selectedAvatarId) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getAvatarImage(selectedAvatarId) as string}
            alt={currentAvatar?.name ?? 'Navi'}
            className="w-full h-full object-cover"
          />
        ) : (
          React.createElement(getAvatarIcon(selectedAvatarId), { className: 'w-4 h-4' })
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <span className="flex gap-1 items-center">
          <span className="thinking-dot animate-bounce [animation-delay:0ms]" />
          <span className="thinking-dot animate-bounce [animation-delay:150ms]" />
          <span className="thinking-dot animate-bounce [animation-delay:300ms]" />
        </span>
        <span className="text-[14px] text-on-surface-variant/50 italic">
          {thinkingText}
        </span>
      </div>
    </div>
  );
};

const ChatMessages: React.FC = () => {
  const { user } = useAuth();
  const { activeChat, isLoadingMessages, isSending, isFinalizing, createNewChat, rateMessage, regenerateMessage, retryMessage, sendMessage, activeChatId, editMessage, deleteMessage, togglePin, avatars, resolvePendingAction } = useChat();
  const { success: toastSuccess, info: toastInfo } = useToast();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const editAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevMsgLengthRef = useRef(0);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; messageId: string; initialRating: number }>({
    isOpen: false,
    messageId: '',
    initialRating: 0
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || !activeChat) return [];
    const q = searchQuery.toLowerCase();
    const matches: { msgId: string; text: string }[] = [];
    for (const msg of activeChat.messages) {
      const raw = msg.type === 'ai' ? msg.text.replace(/<[^>]*>/g, '').replace(/◐|mentare/g, '') : msg.text;
      if (raw.toLowerCase().includes(q)) {
        matches.push({ msgId: msg.id, text: raw });
      }
    }
    return matches;
  }, [searchQuery, activeChat]);

  const totalMatches = searchMatches.length;

  const navigateSearch = useCallback((dir: 1 | -1) => {
    const count = searchMatches.length;
    if (count === 0) return;
    const nextIdx = ((searchMatchIdx + dir) + count) % count;
    setSearchMatchIdx(nextIdx);
    const targetMsgId = searchMatches[nextIdx]?.msgId;
    if (targetMsgId) {
      const el = document.getElementById(`msg-${targetMsgId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchMatches, searchMatchIdx]);

  useEffect(() => {
    setSearchMatchIdx(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showSearch && searchQuery) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          navigateSearch(e.shiftKey ? -1 : 1);
        }
        if (e.key === 'Escape') {
          setShowSearch(false);
          setSearchQuery('');
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && activeChat) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showSearch, searchQuery, activeChat, searchMatchIdx, totalMatches, setSearchQuery, navigateSearch]);

  const handleRateAction = (messageId: string, rating: number) => {
    if (rating < 5) {
      setFeedbackModal({ isOpen: true, messageId, initialRating: rating });
    } else {
      rateMessage(messageId, rating);
    }
  };

  const handleFeedbackSubmit = (rating: number, tags: string[], comment: string) => {
    rateMessage(feedbackModal.messageId, rating, tags, comment);
  };

  const handleEditSave = async (messageId: string) => {
    if (!editText.trim()) return;
    setEditingId(null);
    await editMessage(messageId, editText.trim());
    setEditText('');
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
      setShowScrollBtn(distanceFromBottom > 150);
      if (nearBottom) setNewMsgCount(0);
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
    setNewMsgCount(0);
  };

  const msgCount = activeChat?.messages?.length || 0;
  const lastMsgTextLength = activeChat?.messages?.[msgCount - 1]?.text?.length || 0;
  useEffect(() => {
    const prevLength = prevMsgLengthRef.current;
    if (msgCount > prevLength && !isNearBottom) {
      setNewMsgCount(count => count + (msgCount - prevLength));
    }
    prevMsgLengthRef.current = msgCount;
  }, [msgCount, isNearBottom]);

  useEffect(() => {
    if (isNearBottom) {
      const timeoutId = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [msgCount, isSending, isNearBottom, lastMsgTextLength]);

  useEffect(() => {
    sanitizedHtmlCache.clear();
  }, [activeChatId]);

  if (!activeChat && !isLoadingMessages) {
    return null;
  }

  if (isLoadingMessages) {
    return <LoadingSkeleton />;
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const messages = activeChat?.messages || [];

  const getSmartSuggestions = (msg: typeof messages[0]): string[] => {
    if (!msg) return quickReplyOptions.slice(0, 3);
    const topic = msg.topic || 'general';
    const suggestions = topicSuggestions[topic] || topicSuggestions.general;
    const intentCompletion = msg.intent ? intentCompletions[msg.intent] : null;
    const combined = intentCompletion ? [intentCompletion, ...suggestions] : suggestions;
    return combined.slice(0, 3);
  };

  const highlightPlainText = (text: string, msgId: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;
    const q = searchQuery;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const isCurrentMatch = searchMatches[searchMatchIdx]?.msgId === msgId;
    return (
      <>
        {text.slice(0, idx)}
        <span className={`search-highlight${isCurrentMatch ? ' current' : ''}`}>
          {text.slice(idx, idx + q.length)}
        </span>
        {highlightPlainText(text.slice(idx + q.length), msgId)}
      </>
    );
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {isSending && activeChat?.messages && activeChat.messages.length > 0 && t('chat.newResponseArriving')}
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-messages-scroll px-4 sm:px-6 py-4 pb-2 min-w-0 w-full h-full"
      >
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="chat-search-bar"
            >
              <Search className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat.searchPlaceholder')}
                autoFocus
                aria-label={t('chat.searchMessages')}
              />
              {searchQuery && (
                <span className="search-count">
                  {totalMatches > 0 ? `${Math.min(searchMatchIdx + 1, totalMatches)}/${totalMatches}` : '0/0'}
                </span>
              )}
              {totalMatches > 0 && (
                <>
                  <button onClick={() => navigateSearch(-1)} title={t('chat.searchPrevious')} aria-label={t('chat.searchPrevious')}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigateSearch(1)} title={t('chat.searchNext')} aria-label={t('chat.searchNext')}>
                    <ChevronUp className="w-4 h-4 rotate-180" />
                  </button>
                </>
              )}
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} title={t('chat.searchClose')} aria-label={t('chat.searchClose')}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="chat-msg-list flex min-h-full flex-col justify-end gap-4 sm:gap-5 3xl:gap-6">
        <AnimatePresence mode="popLayout">
        {messages.map((msg, i) => {
        if (msg.type === 'system') return <SystemBubble key={msg.clientId || msg.id || i} text={msg.text} />;

        const isAi = msg.type === 'ai';
        const isLastAiMsg = isAi && i === messages.length - 1;

        let mainText = msg.text;
        let thinkingText = '';

        if (isAi && msg.text.includes('<tool_call>')) {
          const parts = msg.text.split('mentare');
          if (parts.length > 1) {
            thinkingText = parts[0].replace('<tool_call>', '').trim();
            mainText = parts.slice(1).join('mentare').trim();
          } else {
            thinkingText = msg.text.replace(' CPS', '').trim();
            mainText = '';
          }
        }

        // Backend signalled the tool-use loop got stuck — show fallback copy
        // instead of whatever partial text came through.
        if (isAi && msg.toolLoopExceeded) {
          mainText = t('chat.toolLoopFallback');
        }

        const isSpeaking = speakingId === msg.id;

        const handleSpeak = (text: string) => {
          if (isSpeaking) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            toastInfo(t('chat.speechStopped'));
            return;
          }
          const cleanText = text.replace(/<[^>]*>/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.onend = () => setSpeakingId(null);
          utterance.onerror = () => setSpeakingId(null);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
          setSpeakingId(msg.id);
          toastInfo(t('chat.speaking'));
        };

        if (isAi && !msg.text && isSending) return null;

        const isStreamingAi = isAi && isSending && isLastAiMsg && mainText.length > 0 && !msg.error;

        if (isAi) {
          const isSearchMatch = searchMatches.some(m => m.msgId === msg.id);
          const isCurrentSearchMatch = searchMatches[searchMatchIdx]?.msgId === msg.id;

          return (
            <motion.div
              key={msg.clientId || msg.id || i}
              id={`msg-${msg.id}`}
              className={`group/msg relative${isSearchMatch ? ' ring-1 ring-secondary/10 rounded-lg' : ''}${isCurrentSearchMatch ? ' ring-2 ring-secondary/30' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.05, 0.3) }}
            >
              {msg.pinned && (
                <div className="msg-pin-badge"><Pin className="w-2.5 h-2.5" /></div>
              )}
              <div className="flex gap-3 items-start">
                <div className={`ai-avatar overflow-hidden ${msg.avatarId && msg.avatarId !== 'navi' ? getAvatarAccent(msg.avatarId) : ''}`}>
                  {getAvatarImage(msg.avatarId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAvatarImage(msg.avatarId) as string}
                      alt={(msg.avatarId ? avatars.find(a => a.avatarId === msg.avatarId)?.name : null) ?? msg.avatarName ?? 'Navi'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    React.createElement(getAvatarIcon(msg.avatarId), { className: 'w-4 h-4' })
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    if (!msg.avatarId || msg.avatarId === 'navi') return null;
                    const catalogEntry = avatars.find(a => a.avatarId === msg.avatarId);
                    const resolvedName = catalogEntry?.name ?? msg.avatarName ?? null;
                    const resolvedTitle = catalogEntry?.title ?? msg.avatarTitle ?? null;
                    const resolvedCost = catalogEntry?.creditCost ?? msg.avatarCreditCost;
                    const accent = catalogEntry?.accentColor;
                    if (!resolvedName) return null;
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold mb-1.5 px-2 py-0.5 rounded-full border"
                        style={accent ? {
                          color: accent,
                          borderColor: `${accent}55`,
                          backgroundColor: `${accent}14`,
                        } : undefined}
                      >
                        <span>{resolvedName}</span>
                        {resolvedTitle && (
                          <span className="opacity-60 font-medium">· {resolvedTitle}</span>
                        )}
                        {typeof resolvedCost === 'number' && resolvedCost > 0 && (
                          <span className="opacity-60 font-medium">· {resolvedCost} {resolvedCost === 1 ? 'credit' : 'credits'}</span>
                        )}
                      </span>
                    );
                  })()}
                  {thinkingText && (
                    <details className="mb-3 group/think">
                      <summary className="text-[13px] font-bold text-secondary/50 cursor-pointer list-none flex items-center gap-1.5 hover:text-secondary transition-colors">
                        <ChevronRight className="w-3 h-3 group-open/think:rotate-90 transition-transform" />
                        {t('chat.thoughtProcess')}
                      </summary>
                      <div className="mt-2 pl-3 border-l border-secondary/15 text-[13px] text-on-surface-variant/50 italic leading-relaxed whitespace-pre-wrap">
                        {thinkingText}
                      </div>
                    </details>
                  )}

                  <div className="ai-bubble-container">
                  <div
                    className="ai-message-content text-on-surface-variant text-[15px] sm:text-[16px] leading-[1.8] max-w-[65ch]"
                    dangerouslySetInnerHTML={{ __html: getSanitizedHtml(msg.id, mainText) }}
                    onClick={(e) => {
                      const btn = (e.target as Element).closest('[data-action="copy-code"]');
                      if (!btn) return;
                      const wrapper = btn.closest('.code-block-wrapper');
                      const codeEl = wrapper?.querySelector('code');
                      if (codeEl) {
                        navigator.clipboard.writeText(codeEl.textContent || '');
                        toastSuccess(t('chat.copiedToClipboard'));
                      }
                    }}
                  />
                  </div>

                  {isStreamingAi && (
                    <span className="typing-cursor inline-block w-[2px] h-[1em] bg-secondary/70 ml-0.5 rounded-sm align-text-bottom" />
                  )}

{msg.error && (
                    <div className={`flex items-center gap-2 mt-3 p-3 rounded-xl border ${msg.errorCode === 'llm_unavailable' ? 'bg-amber-500/8 border-amber-500/15' : msg.errorCode === 'capacity' ? 'bg-orange-500/8 border-orange-500/15' : 'bg-red-500/8 border-red-500/15'}`}>
                      <AlertCircle className={`w-4 h-4 shrink-0 ${msg.errorCode === 'llm_unavailable' ? 'text-amber-400' : msg.errorCode === 'capacity' ? 'text-orange-400' : 'text-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] ${msg.errorCode === 'llm_unavailable' ? 'text-amber-300' : msg.errorCode === 'capacity' ? 'text-orange-300' : 'text-red-300'}`}>{msg.errorMessage || t('chat.failedResponse')}</p>
                      </div>
                      <button
 onClick={() => { haptic(); retryMessage(msg.id); }}
                        className={`shrink-0 px-3 py-1.5 ripple-btn rounded-lg text-[12px] font-medium transition-colors ${msg.errorCode === 'llm_unavailable' ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400' : msg.errorCode === 'capacity' ? 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-400' : 'bg-red-500/15 hover:bg-red-500/25 text-red-400'}`}
                      >
                        {t('chat.retry')}
                      </button>
                    </div>
                  )}

                  {msg.pendingActions && msg.pendingActions.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.pendingActions.map((action) => {
                        const resolved = msg.resolvedActions?.[action.memberId];
                        const status = resolved?.status;

                        if (status === 'done' && resolved?.result) {
                          const palette = bandPalette(resolved.result.band as string);
                          const topFactors = (resolved.result.factors ?? []).slice(0, 3);
                          return (
                            <Card
                              key={action.memberId}
                              variant="bordered"
                              padding="none"
                              hoverable={false}
                              className={`!rounded-xl !p-3 !bg-background ${palette.border}`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Heart className={`w-4 h-4 shrink-0 ${palette.text}`} />
                                  <p className="text-[13px] font-bold text-on-surface-variant truncate">{action.memberName}</p>
                                </div>
                                <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${palette.bg} ${palette.text} ${palette.border}`}>
                                  {resolved.result.band}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className={`text-[22px] font-headline font-bold ${palette.text}`}>{resolved.result.score}</span>
                                <span className="text-[11px] text-on-surface-variant/40">/ 100</span>
                              </div>
                              {resolved.result.verdict && (
                                <p className="text-[12px] text-on-surface-variant/70 leading-relaxed mb-2">{resolved.result.verdict}</p>
                              )}
                              {topFactors.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                  {topFactors.map((f) => (
                                    <div key={f.name} className="bg-surface-variant/25 rounded-md px-2 py-1.5">
                                      <p className="text-[10px] text-on-surface-variant/40 mb-0.5 truncate">{f.label}</p>
                                      <p className="text-[12px] font-semibold text-on-surface-variant">{Math.round(f.score_percent)}%</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          );
                        }

                        const isRunning = status === 'running';
                        const isError = status === 'error';

                        return (
                          <div key={action.memberId} className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              disabled={isRunning || isError}
                              onClick={() => { haptic(); resolvePendingAction(msg.id, action.memberId, action.connectionId); }}
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${
                                isRunning || isError
                                  ? 'bg-surface-variant/15 border-outline-variant/15 text-on-surface-variant/40 cursor-not-allowed'
                                  : 'bg-amber-500/8 border-amber-500/25 hover:bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                {isRunning ? (
                                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                                ) : (
                                  <Heart className="w-4 h-4 shrink-0" />
                                )}
                                <span className="flex flex-col min-w-0">
                                  <span className="text-[13px] font-semibold truncate">
                                    {isRunning ? t('chat.pendingActionRunning') : t('chat.pendingRunCompat')}
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant/40 truncate">
                                    {action.memberName}
                                  </span>
                                </span>
                              </span>
                              {!isRunning && (
                                <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest">
                                  {t('chat.pendingRunCompatCost', { cost: action.creditCost })}
                                </span>
                              )}
                            </button>
                            {isError && (
                              <p className="text-[11px] text-red-300/80 px-1">{resolved?.errorMessage || t('chat.pendingActionError')}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.insights && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-outline-variant/15 !p-3 mt-3 !bg-background">
                      <p className="text-[12px] font-bold text-secondary flex items-center gap-1.5 mb-2">
                        {t('chat.chartFactors')}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.insights.map((item) => (
                          <div key={item.label} className="bg-surface-variant/25 rounded-md px-2 py-1.5">
                            <p className="text-[10px] text-on-surface-variant/40 mb-0.5">{item.label}</p>
                            <p className="text-[12px] font-semibold text-on-surface-variant">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {msg.dasha && (
                    <Card variant="bordered" padding="none" hoverable={false} className="!rounded-xl !border-secondary/10 !p-3 mt-3 !bg-background">
                      <p className="text-[13px] font-bold text-secondary mb-2">{msg.dasha.title}</p>
                      {msg.dasha.rows.map((row) => (
                        <div key={row.planet} className="flex items-center gap-2 py-1 border-b border-outline-variant/10 last:border-b-0">
                          <span className="text-[13px] text-on-surface-variant w-[72px] shrink-0">{row.planet}</span>
                          <div className="flex-1 h-1 bg-outline-variant/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: row.fill,
                                backgroundColor: row.active ? 'var(--secondary)' : (row.fillColor || 'var(--outline-variant)'),
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-on-surface-variant/40 whitespace-nowrap">
                            {row.dates}
                            {row.active && (
                              <span className="ml-1 text-[10px] bg-secondary text-on-primary px-1.5 py-px rounded font-bold">{t('chat.dashaNow')}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              </div>

              {msg.createdAt && (
                <p className="text-[10px] text-on-surface-variant/25 mt-1 ml-10" title={formatDisplayDateTime(msg.createdAt)}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              )}

              {isAi && msg.id && !isFinalizing && (
                <div className="flex items-center gap-1.5 sm:gap-3 mt-1 ml-10 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity duration-200 msg-action-row">
                  <RatingMeter
                    rating={msg.rating}
                    onRate={(rating) => handleRateAction(msg.id, rating)}
                    size="sm"
                  />
                  <div className="w-[1px] h-3 bg-outline-variant/30" />
<button
                    onClick={() => handleSpeak(mainText)}
                    className={`msg-action-btn ripple-btn ${isSpeaking ? 'text-secondary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                    title={isSpeaking ? t('chat.stop') : t('chat.speak')}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                  <button
 onClick={() => {
 navigator.clipboard.writeText(mainText.replace(/<[^>]*>/g, ''));
                        setCopiedId(msg.id);
                        toastSuccess(t('chat.copiedToClipboard'));
                       setTimeout(() => setCopiedId(null), 2000);
                      }}
                    className="msg-action-btn ripple-btn text-on-surface-variant/30 hover:text-on-surface-variant"
                    title={t('chat.copy')}
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-secondary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => { togglePin(msg.id); }}
                    className={`msg-action-btn ripple-btn ${msg.pinned ? 'text-secondary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                    title={msg.pinned ? t('chat.unpin') : t('chat.pin')}
                    aria-label={msg.pinned ? t('chat.unpinMessage') : t('chat.pinMessage')}
                  >
                    {msg.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  {isLastAiMsg && !isSending && (
                    <button
                      onClick={() => { haptic(); regenerateMessage(msg.id); }}
                      className="msg-action-btn ripple-btn text-on-surface-variant/30 hover:text-secondary"
                      title={t('chat.regenerate')}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {isAi && isLastAiMsg && !isSending && (
                <div className="flex flex-nowrap overflow-x-auto gap-1.5 mt-2 ml-10 msg-suggestion-pills">
                  {(msg.suggestedQuestions?.slice(0, 3) || getSmartSuggestions(msg)).map((option, qIdx) => (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: qIdx * 0.08 }}
                      onClick={() => {
                        haptic(true);
                        if (activeChatId) {
                          sendMessage(option);
                        } else {
                          createNewChat(option);
                        }
                      }}
                      className="ripple-btn suggestion-pill"
                      aria-label={`Ask: ${option}`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        }

        return (
          <React.Fragment key={msg.clientId || msg.id || i}>
            {/* Avatar-switch divider: show above the user message when the
             *  previous AI response and the next AI response used different
             *  avatars (i.e. the user changed personas before this message). */}
            {(() => {
              const findPrevAiAvatar = (): string | null => {
                for (let j = i - 1; j >= 0; j--) {
                  const m = messages[j];
                  if (m.type === 'ai' && m.avatarId) return m.avatarId;
                }
                return null;
              };
              const findNextAiAvatar = (): string | null => {
                for (let j = i + 1; j < messages.length; j++) {
                  const m = messages[j];
                  if (m.type === 'ai' && m.avatarId) return m.avatarId;
                }
                return null;
              };
              const prevAvatar = findPrevAiAvatar();
              const nextAvatar = findNextAiAvatar();
              if (!prevAvatar || !nextAvatar || prevAvatar === nextAvatar) return null;
              const newAvatar = avatars.find(a => a.avatarId === nextAvatar);
              if (!newAvatar) return null;
              const accent = newAvatar.accentColor;
              return (
                <div className="flex items-center justify-center my-3" aria-label={`Switched to ${newAvatar.name}`}>
                  <span className="flex-1 h-px bg-outline-variant/30" />
                  <span
                    className="mx-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={accent ? {
                      color: accent,
                      borderColor: `${accent}55`,
                      backgroundColor: `${accent}10`,
                    } : undefined}
                  >
                    Switched to {newAvatar.name}
                  </span>
                  <span className="flex-1 h-px bg-outline-variant/30" />
                </div>
              );
            })()}
            <motion.div
              id={`msg-${msg.id}`}
              className="group/msg flex justify-end items-start gap-2"
              initial={{ opacity: 0, y: 12, x: 8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.05, 0.3) }}
            >
            <div className="flex flex-col items-end gap-1.5 min-w-0 max-w-[82%] sm:max-w-[min(75%,42rem)]">
              <div className="user-bubble text-[14px] text-on-surface break-words w-full" style={{ overflowWrap: 'anywhere' }}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/10 rounded-lg text-[12px]">
                        {att.type.startsWith('image/') ? (
                          att.preview ? (
                            <img src={att.preview} alt={att.name} className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <Image className="w-3.5 h-3.5 text-secondary" />
                          )
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-on-surface-variant truncate max-w-[120px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={editAreaRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSave(msg.id);
                        }
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditText('');
                        }
                      }}
                      className="msg-edit-area"
                      rows={2}
                      autoFocus
aria-label={t('chat.editMessage')}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSave(msg.id)}
                        disabled={!editText.trim()}
                        className="px-3 py-1 bg-secondary text-on-primary rounded-lg text-[12px] font-medium disabled:opacity-40 transition-opacity"
                        aria-label={t('chat.saveEdit')}
                      >
                        {t('chat.saveEdit')}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditText(''); }}
                        className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-lg text-[12px] font-medium hover:bg-surface-variant/70 transition-colors"
                        aria-label={t('chat.cancelEdit')}
                      >
                        {t('chat.cancelEdit')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {highlightPlainText(msg.text, msg.id)}
                    {msg.edited && <span className="msg-edited-label">{t('chat.editedLabel')}</span>}
                  </>
                )}
              </div>

              {deletingId === msg.id && (
                <div className="msg-delete-confirm">
                  <span className="flex-1">{t('chat.confirmDeleteMsg')}</span>
                  <button
                    onClick={() => { deleteMessage(msg.id); setDeletingId(null); }}
                    className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-md text-[11px] font-bold hover:bg-red-500/30 transition-colors"
                    aria-label={t('chat.confirmDeleteMsg')}
                  >
                    {t('chat.confirmDeleteYes')}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="px-2.5 py-1 bg-surface-variant text-on-surface-variant rounded-md text-[11px] hover:bg-surface-variant/70 transition-colors"
                    aria-label={t('chat.cancelEdit')}
                  >
                    {t('chat.confirmDeleteNo')}
                  </button>
                </div>
              )}

              {!isSending && (
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => { haptic(); setEditingId(msg.id); setEditText(msg.text); }}
                    className="msg-action-btn text-on-surface-variant/30 hover:text-secondary"
                    title={t('chat.editMessage')}
                    aria-label={t('chat.editMessage')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { haptic(); setDeletingId(msg.id === deletingId ? null : msg.id); }}
                    className="msg-action-btn text-on-surface-variant/30 hover:text-red-400"
                    title={t('chat.sidebar.delete')}
                    aria-label={t('chat.sidebar.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="user-avatar">
              {userInitial}
            </div>
          </motion.div>
          </React.Fragment>
        );
        })}
        </AnimatePresence>

        {isSending && <ThinkingIndicator />}
        </div>
      </div>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        messageId={feedbackModal.messageId}
        initialRating={feedbackModal.initialRating}
        onSubmit={handleFeedbackSubmit}
      />

      <AnimatePresence>
        {(showScrollBtn || newMsgCount > 0) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className={`absolute bottom-4 right-4 sm:right-6 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-md transition-all z-30 ${
              newMsgCount > 0
                ? 'bg-secondary text-on-primary hover:bg-secondary/90'
                : 'bg-surface border border-outline-variant/20 text-secondary hover:bg-surface-variant'
            }`}
            aria-label={t('chat.messages.scrollToLatest')}
          >
            <ArrowDown className="w-4 h-4" />
            {newMsgCount > 0 && (
              <span className="text-[12px] font-semibold whitespace-nowrap">
                {newMsgCount > 1 ? `${newMsgCount} ${t('chat.newMessages')}` : t('chat.newMessage')}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMessages;
