'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'isomorphic-dompurify';
import { parseMarkdown, autoFormatAstrology, cleanTextForSpeech } from '@/utils/markdownParser';
import Card from '@/components/ui/Card';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import ReportModal from './ReportModal';
import { formatRelativeTime, formatDisplayDateTime } from '@/lib/datetime';
import { useToast, useTranslation, useVoiceSettings, resolveLangAndVoiceForText } from '@/hooks';
import { isSpeechSupported } from '@/hooks/useVoiceSettings';
import { speakViaCloud, type SpeakHandle } from '@/utils/cloudTts';
import { Volume2, Copy, ChevronRight, RefreshCw, Check, AlertCircle, ArrowDown, Image as ImageIcon, FileText, Pencil, Trash2, Pin, PinOff, Search, X, ChevronUp, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { getAvatarIcon, getAvatarAccent, getAvatarImage, getAvatarTheme } from '@/utils/avatarStyle';

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

/** Split an assistant answer into stacked bubbles. A blank line (`\n\n+`) is
 *  the only box boundary — language-neutral, so it works for Kannada/Hindi/
 *  Korean identically. Single `\n` inside a box is a soft break. Lists stay
 *  together (their items are single-`\n` separated). `## ` headings land in
 *  their own box because the backend always follows them with `\n\n`. Fenced
 *  code blocks are never split (their internal blank lines are preserved). */
function splitIntoBubbles(text: string): string[] {
  if (!text || !text.trim()) return [];
  const blocks: string[] = [];
  let cur: string[] = [];
  let inFence = false;
  const flush = () => {
    const joined = cur.join('\n').trim();
    if (joined) blocks.push(joined);
    cur = [];
  };
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && !line.trim()) { flush(); continue; }
    cur.push(line);
  }
  flush();
  return blocks;
}

const OR_WORDS = ['or', 'या', 'किंवा', 'অথবা', 'নাকি', 'અથવા', 'કે', 'ಅಥವಾ', '또는', '아니면', 'അതോ', 'അല്ലെങ്കിൽ', 'ਜਾਂ', 'அல்லது', 'లేదా'];
const OR_SPLIT = new RegExp(`\\s+(?:${OR_WORDS.join('|')})\\s+`, 'i');
const OR_LEADING = new RegExp(`^(?:${OR_WORDS.join('|')})\\s+`, 'i');

/** Parse the trailing multiple-choice question ("…career, money,
 *  relationships, or health?") into tappable chip options. Returns [] when
 *  the block doesn't look like a clean 3–5 option closing question. */
function parseClosingOptions(block: string): string[] {
  const plain = block.replace(/\*\*/g, '').replace(/<[^>]*>/g, '').trim();
  if (!plain.endsWith('?') || !plain.includes(',')) return [];
  const qStart = Math.max(
    plain.lastIndexOf('.', plain.length - 2),
    plain.lastIndexOf('!', plain.length - 2),
    plain.lastIndexOf('?', plain.length - 2),
    plain.lastIndexOf(':'),
    plain.lastIndexOf('—'),
    plain.lastIndexOf('\n'),
  );
  const q = plain.slice(qStart + 1, -1).trim();
  const segments = q.split(',').map(s => s.trim()).filter(Boolean);
  if (segments.length < 2) return [];
  const rawTail = segments.pop() as string;
  // A genuine choice list always has an "or" before the last option;
  // ordinary comma-laden sentences don't.
  if (!OR_LEADING.test(rawTail) && !OR_SPLIT.test(rawTail)) return [];
  const tail = rawTail.replace(OR_LEADING, '');
  const tailParts = tail.split(OR_SPLIT).map(s => s.trim()).filter(Boolean);
  const middle = segments.slice(1);
  const known = [...middle, ...tailParts];
  if (known.length < 2) return [];
  // The first comma segment carries the lead-in ("Want me to dig into
  // career") — keep only as many trailing words as the longest known option.
  const maxWords = Math.min(4, Math.max(...known.map(o => o.split(/\s+/).length)));
  const firstWords = segments[0].split(/\s+/);
  const first = firstWords.slice(-maxWords).join(' ');
  const options = [first, ...known].map(o => o.replace(/[.?!]+$/, '').trim()).filter(Boolean);
  if (options.length < 3 || options.length > 5) return [];
  if (options.some(o => o.length > 30 || o.length < 2)) return [];
  return options;
}

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

  // Backend-provided narration lines (already localized) win over the
  // generic rotating copy.
  const narration = thinkingData?.narration?.length ? thinkingData.narration : null;
  const statuses = narration ?? getThinkingStatuses(thinkingData?.tools);

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
  let thinkingText: string;
  if (narration) {
    thinkingText = narration[Math.min(statusIdx, narration.length - 1)];
  } else {
    const statusText = t(statuses[statusIdx]);
    const lowerStatusText = statusText.charAt(0).toLowerCase() + statusText.slice(1);
    thinkingText = `${avatarName} is ${lowerStatusText}`;
  }

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
  const { activeChat, isLoadingMessages, isSending, isFinalizing, createNewChat, rateMessage, reportMessage, regenerateMessage, retryMessage, sendMessage, activeChatId, editMessage, deleteMessage, togglePin, avatars } = useChat();
  const { success: toastSuccess, info: toastInfo } = useToast();
  const { t } = useTranslation();
  const { langCode, voices, selectedVoiceURI } = useVoiceSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const editAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevMsgLengthRef = useRef(0);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; messageId: string }>({
    isOpen: false,
    messageId: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speakHandleRef = useRef<SpeakHandle | null>(null);
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

  const handleThumb = (messageId: string, current: 1 | -1 | null | undefined, next: 1 | -1) => {
    haptic(true);
    // Clicking the already-active thumb clears it (toggle off).
    rateMessage(messageId, { thumb: current === next ? null : next });
  };

  const handleReportSubmit = (reason: 'inaccurate' | 'harmful' | 'offensive' | 'other', details: string) => {
    if (!reportModal.messageId) return;
    reportMessage(reportModal.messageId, reason, details || undefined);
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

  // Stop any in-flight speech when the message list unmounts (chat closed /
  // navigated away). Without this, cloud <audio> keeps playing after the
  // bubbles that launched it are gone.
  useEffect(() => {
    return () => {
      if (speakHandleRef.current) { speakHandleRef.current.stop(); speakHandleRef.current = null; }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  if (!activeChat && !isLoadingMessages) {
    return null;
  }

  if (isLoadingMessages) {
    return <LoadingSkeleton />;
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const messages = activeChat?.messages || [];

  const getMsgThemeStyle = (avatarId?: string | null): React.CSSProperties => {
    const id = avatarId && avatarId !== 'navi' ? avatarId : 'navi';
    const catalogEntry = avatars.find(a => a.avatarId === id);
    const theme = getAvatarTheme(id, catalogEntry);
    return {
      '--secondary': theme.secondary,
      '--glow-color': theme.glowColor,
      '--flare-gold': theme.flareGold,
    } as React.CSSProperties;
  };

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
            if (speakHandleRef.current) { speakHandleRef.current.stop(); speakHandleRef.current = null; }
            if (isSpeechSupported()) window.speechSynthesis.cancel();
            setSpeakingId(null);
            toastInfo(t('chat.speechStopped'));
            return;
          }
          const cleanText = cleanTextForSpeech(text);
          const { langCode: detectedLangCode, voice } = resolveLangAndVoiceForText(cleanText, langCode, voices, selectedVoiceURI, msg.lang);

          // Browser fallback for when cloud TTS (backend MP3) is unreachable.
          const speakViaBrowser = () => {
            if (!isSpeechSupported()) { setSpeakingId(null); return; }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = detectedLangCode;
            if (voice) utterance.voice = voice;
            utterance.rate = 0.95;
            utterance.onend = () => setSpeakingId(null);
            utterance.onerror = () => setSpeakingId(null);
            window.speechSynthesis.speak(utterance);
          };

          if (speakHandleRef.current) { speakHandleRef.current.stop(); speakHandleRef.current = null; }
          if (isSpeechSupported()) window.speechSynthesis.cancel();
          setSpeakingId(msg.id);
          toastInfo(t('chat.speaking'));
          speakHandleRef.current = speakViaCloud(cleanText, detectedLangCode, {
            onEnd: () => { if (speakHandleRef.current) speakHandleRef.current = null; setSpeakingId(null); },
            onError: () => { speakHandleRef.current = null; speakViaBrowser(); },
          });
        };

        if (isAi && !msg.text && !msg.opener && isSending) return null;

        const isStreamingAi = isAi && isSending && isLastAiMsg && mainText.length > 0 && !msg.error;

        if (isAi) {
          const boxes = splitIntoBubbles(mainText);
          const isSearchMatch = searchMatches.some(m => m.msgId === msg.id);
          const isCurrentSearchMatch = searchMatches[searchMatchIdx]?.msgId === msg.id;

          return (
            <motion.div
              key={msg.clientId || msg.id || i}
              id={`msg-${msg.id}`}
              className={`group/msg relative${isSearchMatch ? ' ring-1 ring-secondary/10 rounded-lg' : ''}${isCurrentSearchMatch ? ' ring-2 ring-secondary/30' : ''}`}
              style={getMsgThemeStyle(msg.avatarId)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.05, 0.3) }}
            >
              {msg.pinned && (
                <div className="msg-pin-badge"><Pin className="w-2.5 h-2.5" /></div>
              )}
              <div className="flex gap-3 items-start">
                <div className="ai-avatar overflow-hidden">
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

                  {msg.opener && (
                    <div className="ai-bubble-container">
                      <div className="ai-message-content text-on-surface-variant text-[15px] sm:text-[16px] leading-[1.8] max-w-[65ch]">
                        {msg.opener}
                      </div>
                    </div>
                  )}

                  {msg.planSteps && msg.planSteps.length > 0 && (
                    <details className="mt-2 mb-1 group/plan">
                      <summary className="text-[13px] font-bold text-secondary/50 cursor-pointer list-none flex items-center gap-1.5 hover:text-secondary transition-colors">
                        <ChevronRight className="w-3 h-3 group-open/plan:rotate-90 transition-transform" />
                        {t('chat.planApproach')}
                      </summary>
                      <ol className="mt-2 pl-3 border-l border-secondary/15 text-[13px] text-on-surface-variant/50 leading-relaxed list-decimal list-inside">
                        {msg.planSteps.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </details>
                  )}

                  {boxes.map((box, bIdx) => (
                    <motion.div
                      key={bIdx}
                      className="ai-bubble-container"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <div
                        className="ai-message-content text-on-surface-variant text-[15px] sm:text-[16px] leading-[1.8] max-w-[65ch]"
                        dangerouslySetInnerHTML={{ __html: getSanitizedHtml(`${msg.id}:b${bIdx}`, box) }}
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
                      {isStreamingAi && bIdx === boxes.length - 1 && (
                        <span className="typing-cursor inline-block w-[2px] h-[1em] bg-secondary/70 ml-0.5 rounded-sm align-text-bottom" />
                      )}
                    </motion.div>
                  ))}

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

                  {msg.agentic && !isStreamingAi && (msg.reflections?.length || msg.toolTrajectory?.length) ? (
                    <details className="mt-2 group/work">
                      <summary className="text-[12px] font-medium text-on-surface-variant/30 cursor-pointer list-none flex items-center gap-1.5 hover:text-on-surface-variant/60 transition-colors">
                        <ChevronRight className="w-3 h-3 group-open/work:rotate-90 transition-transform" />
                        {t('chat.showWork')}
                        {typeof msg.agentRounds === 'number' && (
                          <span className="opacity-60">· {msg.agentRounds} {msg.agentRounds === 1 ? 'round' : 'rounds'}</span>
                        )}
                      </summary>
                      <div className="mt-2 pl-3 border-l border-outline-variant/20 text-[12px] text-on-surface-variant/40 leading-relaxed flex flex-col gap-1">
                        {msg.toolTrajectory?.map((tr, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-1.5 min-w-0">
                            {tr.ok === false ? <AlertCircle className="w-3 h-3 shrink-0 text-red-400/60" /> : <Check className="w-3 h-3 shrink-0 text-secondary/50" />}
                            <span className="font-mono truncate">{tr.name}</span>
                            {typeof tr.ms === 'number' && <span className="opacity-60 shrink-0">{tr.ms}ms</span>}
                            {tr.error && <span className="text-red-300/60 truncate">{tr.error}</span>}
                          </div>
                        ))}
                        {msg.reflections?.map((r) => (
                          <div key={r.round}>
                            <span className="font-semibold">R{r.round}</span>
                            {typeof r.grounded === 'boolean' && <span> · grounded: {String(r.grounded)}</span>}
                            {typeof r.complete === 'boolean' && <span> · complete: {String(r.complete)}</span>}
                            {typeof r.confidence === 'number' && <span> · conf: {r.confidence}</span>}
                            {r.missing && r.missing.length > 0 && <span> · missing: {r.missing.join(', ')}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>

              {msg.createdAt && (
                <p className="text-[10px] text-on-surface-variant/25 mt-1 ml-10" title={formatDisplayDateTime(msg.createdAt)}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              )}

              {isAi && msg.id && !isFinalizing && (
                <div className="flex items-center gap-1.5 sm:gap-3 mt-1 ml-10 opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-opacity duration-200 msg-action-row">
                  <button
                    onClick={() => handleThumb(msg.id, msg.thumb, 1)}
                    className={`msg-action-btn ripple-btn ${msg.thumb === 1 ? 'text-secondary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                    title={t('chat.thumbUp')}
                    aria-label={t('chat.thumbUp')}
                    aria-pressed={msg.thumb === 1}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${msg.thumb === 1 ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleThumb(msg.id, msg.thumb, -1)}
                    className={`msg-action-btn ripple-btn ${msg.thumb === -1 ? 'text-secondary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                    title={t('chat.thumbDown')}
                    aria-label={t('chat.thumbDown')}
                    aria-pressed={msg.thumb === -1}
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 ${msg.thumb === -1 ? 'fill-current' : ''}`} />
                  </button>
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
                  <button
                    onClick={() => { haptic(); setReportModal({ isOpen: true, messageId: msg.id }); }}
                    className="msg-action-btn ripple-btn text-on-surface-variant/30 hover:text-red-400"
                    title={t('chat.report')}
                    aria-label={t('chat.report')}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isAi && isLastAiMsg && !isSending && (
                <div className="flex flex-nowrap overflow-x-auto gap-1.5 mt-2 ml-10 msg-suggestion-pills">
                  {(() => {
                    const closing = parseClosingOptions(mainText);
                    return closing.length > 0 ? closing : (msg.suggestedQuestions?.slice(0, 3) || getSmartSuggestions(msg));
                  })().map((option, qIdx) => (
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
                            // att.preview is a runtime blob/data URL for an uploaded
                            // attachment; next/image cannot optimize it reliably, so keep a raw <img>.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.preview} alt={att.name} className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-secondary" />
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

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, messageId: '' })}
        onSubmit={handleReportSubmit}
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
