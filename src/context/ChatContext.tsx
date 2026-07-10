'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateUUID } from '@/lib/uuid';
import { truncateCodePoints } from '@/lib/text';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/hooks';
import { usePaywallContext } from '@/context/PaywallContext';
import { PaywallData } from '@/types/paywall';
import type { ChatPageContextSource } from '@/lib/schemas';
import type { ChatAvatar } from '@/types/avatar';

const AVATAR_STORAGE_KEY = 'astranavi_selected_avatar';
const DEFAULT_AVATAR_ID = 'navi';
const VALID_IDS = ['navi', 'career_mentor', 'relationship_guide', 'spiritual_guide', 'astro_sage', 'finance_mentor'];

const readStoredAvatar = (): string => {
  if (typeof window === 'undefined') return DEFAULT_AVATAR_ID;
  try {
    const v = localStorage.getItem('astranavi_selected_avatar');
    return v && VALID_IDS.includes(v) ? v : DEFAULT_AVATAR_ID;
  } catch {
    return DEFAULT_AVATAR_ID;
  }
};

/* ---------- Types ---------- */
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  clientId?: string;
  type: 'system' | 'ai' | 'user';
  text: string;
  attachments?: FileAttachment[];
  rating?: number | null;
  feedbackTags?: string[];
  feedbackComment?: string;
  insights?: { label: string; value: string }[];
  dasha?: { title: string; rows: { planet: string; fill: string; fillColor?: string; dates: string; active?: boolean }[] };
  suggestedQuestions?: string[];
  topic?: "career" | "love" | "study" | "finance" | "health" | "timing" | "remedy" | "general";
  intent?: "greeting" | "yes_no" | "timing" | "comparison" | "advice" | "topic_overview" | "deep_analysis" | "emotional_support" | "remedy_request" | "explanation" | "general";
  answerStyle?: string;
  creditsRemaining?: number | null;
  finishReason?: string | null;
  retryUsed?: boolean;
  qualityRewriteUsed?: boolean;
  quality?: { score?: number; issues?: string[]; passed?: boolean; [key: string]: unknown };
  summaryIncluded?: boolean;
  persona?: string;
  errorCode?: string;
  error?: boolean;
  errorMessage?: string;
  pinned?: boolean;
  edited?: boolean;
  originalText?: string;
  contextUsed?: boolean;
  contextSource?: ChatPageContextSource;
  contextChars?: number;
  /** Set by backend on AI messages — identifies which avatar produced this response.
   *  Null/undefined for user, system, historical, and welcome messages. */
  avatarId?: string | null;
  avatarName?: string;
  avatarTitle?: string;
  avatarCreditCost?: number;
  /** Backend signals the tool-use loop got stuck — UI shows fallback copy. */
  toolLoopExceeded?: boolean;
  /** Templated narrated opener (SSE `opener` event, complex questions only).
   *  Rendered as its own first bubble; NOT part of the token-streamed answer. */
  opener?: string;
  /** True when the full agentic loop ran (metadata.agentic). */
  agentic?: boolean;
  planSteps?: string[];
  reflections?: { round: number; grounded?: boolean; complete?: boolean; missing?: string[]; confidence?: number }[];
  agentRounds?: number;
  toolTrajectory?: { name: string; args?: Record<string, unknown>; ok?: boolean; error?: string | null; ms?: number }[];
  createdAt: string;
}

export interface Chat {
  id: string;
  userEmail: string;
  title: string;
  messages: ChatMessage[];
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  averageRating: number | null;
}

export interface ThinkingData {
  topic?: ChatMessage['topic'];
  intent?: ChatMessage['intent'];
  model?: string;
  answerStyle?: string;
  /** Tool names from the new `tool_use` SSE event. Non-empty means the AI is
   *  consulting family data — UI swaps to a family-flavoured thinking copy. */
  tools?: string[];
  /** Localized, human status lines parallel to `tools` (may be shorter).
   *  When present, the thinking indicator shows these verbatim instead of the
   *  generic rotating copy. Replaced (not accumulated) on each tool_use event. */
  narration?: string[];
}

interface ChatContextType {
  chats: ChatSummary[];
  activeChat: Chat | null;
  activeChatId: string | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isFinalizing: boolean;
  hasMoreChats: boolean;
  isGuest: boolean;
  guestTimeRemaining: number;
  isGuestExpired: boolean;
  enableGuestMode: () => void;
  loadChats: () => Promise<void>;
  loadMoreChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createNewChat: (initialMessage?: string, pageContextSource?: ChatPageContextSource) => Promise<string | null>;
  sendMessage: (text: string, overrideChatId?: string, pageContextSource?: ChatPageContextSource) => Promise<void>;
  rateMessage: (messageId: string, rating: number, feedbackTags?: string[], feedbackComment?: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  attachments: FileAttachment[];
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (isOpen: boolean) => void;
  resetChat: () => void;
  paywall: PaywallData | null;
  clearPaywall: () => void;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  togglePin: (messageId: string) => void;
  thinkingData: ThinkingData | null;
  avatars: ChatAvatar[];
  selectedAvatarId: string;
  setSelectedAvatarId: (avatarId: string) => void;
  isLoadingAvatars: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { success, error: toastError } = useToast();
  const { updateCredits } = usePaywallContext();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallData | null>(null);
  const [thinkingData, setThinkingData] = useState<ThinkingData | null>(null);
  const [avatars, setAvatars] = useState<ChatAvatar[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  const [selectedAvatarId, setSelectedAvatarIdState] = useState<string>(DEFAULT_AVATAR_ID);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hydrate the persisted avatar choice AFTER mount so the server and client
  // render the same initial value (DEFAULT_AVATAR_ID). Reading localStorage in
  // the useState initializer causes a hydration mismatch because the server
  // always returns the default while the client returns the stored value.
  useEffect(() => {
    const stored = readStoredAvatar();
    if (stored !== DEFAULT_AVATAR_ID) {
      setSelectedAvatarIdState(stored);
    }
  }, []);

  const setSelectedAvatarId = useCallback((avatarId: string) => {
    setSelectedAvatarIdState(avatarId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('astranavi_selected_avatar', avatarId);
      } catch {}
    }
  }, []);

  // Guest State
  const [isGuest, setIsGuest] = useState(false);
  const [guestTimeRemaining, setGuestTimeRemaining] = useState(600); // 10 minutes default
  const [isGuestExpired, setIsGuestExpired] = useState(false);

  // Phase 7.1: Guest timer logic
  useEffect(() => {
    if (!isGuest || isGuestExpired) return;
    
    const interval = setInterval(() => {
      setGuestTimeRemaining(prev => {
        if (prev <= 1) {
          setIsGuestExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isGuest, isGuestExpired]);

  const enableGuestMode = useCallback(() => {
    setIsGuest(true);
    const now = new Date().toISOString();
    const guestChat: Chat = {
      id: 'guest-session',
      userEmail: 'guest@astranavi.com',
      title: 'Guest Preview',
      messages: [{
        id: 'welcome',
        type: 'ai',
        text: t('chat.guestWelcome'),
        createdAt: now
      }],
      averageRating: null,
      createdAt: now,
      updatedAt: now
    };
    setActiveChat(guestChat);
    setActiveChatId('guest-session');
  }, [t]);

  const loadChats = useCallback(async () => {
    if (!user?.id || isGuest) return;
    setIsLoadingChats(true);
    try {
      const res = await clientFetch(`/api/chat?limit=20`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load chats');
      if (data.chats) {
        setChats(data.chats);
        setHasMoreChats(!!data.nextCursor);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err: unknown) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.id, isGuest]);

  const loadMoreChats = useCallback(async () => {
    if (!user?.id || !nextCursor || isLoadingChats || isGuest) return;
    setIsLoadingChats(true);
    try {
      const res = await clientFetch(`/api/chat?limit=20&cursor=${nextCursor}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load more chats');
      if (data.chats) {
        setChats(prev => [...prev, ...data.chats]);
        setHasMoreChats(!!data.nextCursor);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err: unknown) {
      console.error('Failed to load more chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.id, nextCursor, isLoadingChats, isGuest]);

  const selectChat = useCallback(async (chatId: string) => {
    if (!chatId || isGuest) return;
    console.log('[selectChat] Loading chat:', chatId);
    setActiveChatId(chatId);
    setIsLoadingMessages(true);
    try {
      const res = await clientFetch(`/api/chat/${chatId}`);
      console.log('[selectChat] Response status:', res.status, res.ok);
      const data = await res.json();
      console.log('[selectChat] Response data keys:', Object.keys(data), 'has chat?', !!data.chat, 'has messages?', !!data.chat?.messages?.length);
      if (!res.ok) throw new Error(data.error || 'Failed to load chat');
      if (data.chat) setActiveChat(data.chat);
      else console.error('[selectChat] No chat object in response! Data:', JSON.stringify(data).slice(0, 500));
    } catch (err: unknown) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isGuest]);

  const sendMessage = useCallback(async (text: string, overrideChatId?: string, pageContextSource?: ChatPageContextSource) => {
    let targetId = overrideChatId || activeChatId;
    
    if (isGuest) {
      const now = new Date().toISOString();
      const userMsg: ChatMessage = { id: generateUUID(), type: 'user', text: text.trim(), createdAt: now };
      const aiMsg: ChatMessage = { id: generateUUID(), type: 'ai', text: '...', createdAt: now };
      
      setActiveChat(prev => prev ? { ...prev, messages: [...prev.messages, userMsg, aiMsg] } : null);
      setIsSending(true);

      setTimeout(() => {
        setActiveChat(prev => {
           if (!prev) return null;
           return {
             ...prev,
             messages: prev.messages.map(m => m.id === aiMsg.id ? { ...m, text: t('chat.guestLoginRequired') } : m)
           };
        });
        setIsSending(false);
      }, 1000);
      return;
    }

    if (!targetId || !text.trim() || !user?.id) return;
    if (isSending) return;
    
    setIsSending(true);
    const now = new Date().toISOString();
    const userMsgId = generateUUID();
    const aiMsgId = generateUUID();
    
    const userMessage: ChatMessage = { id: userMsgId, clientId: userMsgId, type: 'user', text: text.trim(), attachments: attachments.length > 0 ? [...attachments] : undefined, createdAt: now };
    const aiPlaceholder: ChatMessage = { id: aiMsgId, clientId: aiMsgId, type: 'ai', text: '', createdAt: now };

    setActiveChat(prev => prev ? { ...prev, messages: [...prev.messages, userMessage, aiPlaceholder] } : prev);

    try {
      if (targetId.startsWith('temp-')) {
        // Truncate by code point, not UTF-16 unit, so an emoji landing on the
        // 30-char boundary (e.g. 💰) isn't cut into a lone surrogate the
        // backend rejects with a 422.
        const safeTitle = truncateCodePoints(text, 30);
        const createRes = await clientFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: safeTitle, language }),
        });
        const createData = await createRes.json().catch(() => ({} as Record<string, unknown>));

        // Chat creation must succeed before we send the message. If it fails
        // (e.g. 422), stop here — never POST a message against the temporary
        // id, which the backend doesn't know about. Surface the failure on the
        // placeholder so the user can retry instead of silently hanging.
        if (!createRes.ok || !createData.chat?.id) {
          setActiveChat(prev => prev ? {
            ...prev,
            messages: prev.messages.map(m => m.id === aiMsgId ? {
              ...m, text: '', error: true, errorMessage: t('chat.errorSending'),
            } : m),
          } : null);
          toastError(t('chat.errorSending'));
          return;
        }

        // Replace the temporary id with the backend UUID before sending.
        targetId = createData.chat.id;
        setActiveChatId(targetId);
        setActiveChat(prev => prev ? { ...prev, id: targetId as string } : null);
      }

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const res = await clientFetch(`/api/chat/${targetId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          ...(pageContextSource ? { context: { source: pageContextSource } } : {}),
          ...(selectedAvatarId && selectedAvatarId !== DEFAULT_AVATAR_ID ? { avatarId: selectedAvatarId } : {}),
        }),
        signal: abortController.signal,
      });

      // ── 400 invalid_avatar fallback ──
      // Backend rejects unknown avatars. Reset to navi and let the user retry.
      if (res.status === 400) {
        const errData = await res.clone().json().catch(() => ({} as Record<string, unknown>));
        if (errData?.error === 'invalid_avatar') {
          setSelectedAvatarId(DEFAULT_AVATAR_ID);
          setActiveChat(prev => prev ? {
            ...prev,
            messages: prev.messages.map(m => m.id === aiMsgId ? {
              ...m,
              text: '',
              error: true,
              errorMessage: t('chat.errorSending'),
            } : m),
          } : null);
          toastError(t('chat.errorSending'));
          setIsSending(false);
          return;
        }
      }

      // ── 402 Paywall detection ──
      // If the backend returns 402, the feature is blocked.
      // Parse the paywall data and show PaywallCard instead of streaming.
      if (res.status === 402) {
        const data = await res.json();
        const paywallData = data.paywall || data.detail?.paywall || data;
        setPaywall(paywallData as PaywallData);
        setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === aiMsgId ? { ...m, text: '⚠️ This feature requires an upgrade.' } : m) } : null);
        setIsSending(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      let currentEventName = '';
      let streamDone = false;
      let persistedAiMsgId: string | null = null;

      if (reader) {
        while (!streamDone) {
          if (abortController.signal.aborted) {
            // A newer send aborted this stream; stop reading and don't write any
            // more state into the (now superseded) message.
            break;
          }
          const { done, value } = await reader.read();
          if (abortController.signal.aborted) break;
          if (done) {
            setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, text: fullText } : m) } : null);
            setThinkingData(null);
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (streamDone) break;
            const trimmed = line.trim();
            if (trimmed.startsWith('event: ')) {
              currentEventName = trimmed.slice(7);
              continue;
            }
            if (!trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, text: fullText } : m) } : null);
              setThinkingData(null);
              streamDone = true;
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (currentEventName === 'thinking') {
                setThinkingData(prev => ({
                  ...(prev ?? {}),
                  topic: data.topic ?? undefined,
                  intent: data.intent ?? undefined,
                  model: data.model ?? undefined,
                  answerStyle: data.answerStyle ?? undefined,
                }));
              } else if (currentEventName === 'opener') {
                // Pre-localized templated line for complex questions. Shown as
                // its own first bubble right away to mask the data-gather.
                if (typeof data.text === 'string' && data.text) {
                  setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, opener: data.text } : m) } : null);
                }
              } else if (currentEventName === 'plan') {
                if (Array.isArray(data.steps)) {
                  const steps = (data.steps as unknown[]).filter((s): s is string => typeof s === 'string');
                  setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, planSteps: steps } : m) } : null);
                }
              } else if (currentEventName === 'tool_use') {
                // The AI is consulting family/relationship data. We just track
                // the tool names; the indicator decides what copy to show.
                const tools = Array.isArray(data.tools) ? (data.tools as string[]) : [];
                const narration = Array.isArray(data.narration)
                  ? (data.narration as unknown[]).filter((s): s is string => typeof s === 'string')
                  : undefined;
                setThinkingData(prev => ({ ...(prev ?? {}), tools, narration }));
              } else if (currentEventName === 'metadata') {
                if (typeof data.aiMessageId === 'string' && data.aiMessageId) {
                  persistedAiMsgId = data.aiMessageId;
                }
                const errorCode = data.errorCode as string | undefined;
                setActiveChat(prev => prev ? {
                  ...prev,
                  messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? {
                    ...m,
                    id: persistedAiMsgId ?? m.id,
                    suggestedQuestions: data.suggestedQuestions ?? m.suggestedQuestions,
                    topic: data.topic ?? m.topic,
                    intent: data.intent ?? m.intent,
                    answerStyle: data.answerStyle ?? m.answerStyle,
                    creditsRemaining: data.creditsRemaining ?? m.creditsRemaining,
                    finishReason: data.finishReason ?? m.finishReason,
                    retryUsed: data.retryUsed ?? m.retryUsed,
                    qualityRewriteUsed: data.qualityRewriteUsed ?? m.qualityRewriteUsed,
                    quality: data.quality ?? m.quality,
                    summaryIncluded: data.summaryIncluded ?? m.summaryIncluded,
                    persona: data.persona ?? m.persona,
                    contextUsed: data.contextUsed ?? m.contextUsed,
                    contextSource: data.contextSource ?? m.contextSource,
                    contextChars: data.contextChars ?? m.contextChars,
                    avatarId: data.avatarId ?? m.avatarId,
                    avatarName: data.avatarName ?? m.avatarName,
                    avatarTitle: data.avatarTitle ?? m.avatarTitle,
                    avatarCreditCost: data.avatarCreditCost ?? m.avatarCreditCost,
                    toolLoopExceeded: typeof data.toolLoopExceeded === 'boolean' ? data.toolLoopExceeded : m.toolLoopExceeded,
                    agentic: typeof data.agentic === 'boolean' ? data.agentic : m.agentic,
                    planSteps: Array.isArray(data.planSteps) ? data.planSteps : m.planSteps,
                    reflections: Array.isArray(data.reflections) ? data.reflections : m.reflections,
                    agentRounds: typeof data.agentRounds === 'number' ? data.agentRounds : m.agentRounds,
                    toolTrajectory: Array.isArray(data.toolTrajectory) ? data.toolTrajectory : m.toolTrajectory,
                    errorCode: errorCode ?? m.errorCode,
                    error: errorCode ? true : m.error,
                    errorMessage: errorCode ? (() => {
                      if (errorCode === 'capacity') return t('chat.errorCapacity');
                      if (errorCode === 'response_interrupted') return t('chat.errorResponseInterrupted');
                      if (errorCode === 'llm_unavailable') return t('chat.errorLlmUnavailable');
                      return t('chat.failedResponse');
                    })() : m.errorMessage,
                  } : m)
                } : null);
                if (typeof data.creditsRemaining === 'number') {
                  updateCredits(data.creditsRemaining);
                }
              } else if (typeof data.token === 'string' && data.token.length > 0) {
                // Accumulate tokens silently — the full answer is revealed as a
                // single complete bubble once the stream finishes, rather than
                // streamed word-by-word into the UI.
                fullText += data.token;
                if (abortController.signal.aborted) {
                  streamDone = true;
                }
              }
              currentEventName = '';
            } catch (e) {
              console.warn('Failed to parse stream token:', dataStr, e);
              currentEventName = '';
            }
          }
        }
      }

      if (targetId && !targetId.startsWith('temp-')) {
        setIsFinalizing(true);
        try {
          const chatRes = await clientFetch(`/api/chat/${targetId}`);
          const chatData = await chatRes.json();
          if (chatRes.ok && chatData.chat) {
            const backendChat = chatData.chat as Chat;
            setActiveChat(prev => {
              if (!prev) return backendChat;
              const localAiMsg = prev.messages.find(m => m.id === persistedAiMsgId || m.id === aiMsgId);
              if (!localAiMsg) return backendChat;
              const backendAiMsg = backendChat.messages.find(m => m.id === persistedAiMsgId) ?? backendChat.messages.find(m => m.type === 'ai' && m.text === localAiMsg.text);
              // Align backend messages to the local optimistic messages so we
              // can carry over their stable `clientId`. Keeping the React key
              // stable prevents the whole conversation from remounting (and
              // replaying its enter animation / reflowing spacing) when the
              // post-stream refetch swaps in server-assigned ids.
              const localById = new Map(prev.messages.map(m => [m.id, m]));
              const localByText = new Map(prev.messages.map(m => [`${m.type}\u0000${m.text}`, m]));
              const mergeLocal = (m: ChatMessage): ChatMessage => {
                const local = localById.get(m.id) ?? localByText.get(`${m.type}\u0000${m.text}`);
                return local?.clientId && local.clientId !== m.clientId ? { ...m, clientId: local.clientId } : m;
              };
              if (backendAiMsg && (localAiMsg.suggestedQuestions || localAiMsg.topic || localAiMsg.intent || localAiMsg.answerStyle || localAiMsg.creditsRemaining !== undefined || localAiMsg.finishReason || localAiMsg.retryUsed !== undefined || localAiMsg.qualityRewriteUsed !== undefined || localAiMsg.quality || localAiMsg.summaryIncluded !== undefined || localAiMsg.persona || localAiMsg.errorCode || localAiMsg.contextUsed !== undefined || localAiMsg.contextSource || localAiMsg.contextChars !== undefined || localAiMsg.avatarId || localAiMsg.avatarName || localAiMsg.avatarTitle || localAiMsg.avatarCreditCost !== undefined || localAiMsg.opener || localAiMsg.toolLoopExceeded !== undefined || localAiMsg.agentic !== undefined || localAiMsg.planSteps || localAiMsg.reflections || localAiMsg.agentRounds !== undefined || localAiMsg.toolTrajectory)) {
                const merged = backendChat.messages.map(m => {
                  const aligned = mergeLocal(m);
                  if (m.id === backendAiMsg.id) {
                    return {
                      ...aligned,
                      suggestedQuestions: localAiMsg.suggestedQuestions ?? aligned.suggestedQuestions,
                      topic: localAiMsg.topic ?? aligned.topic,
                      intent: localAiMsg.intent ?? aligned.intent,
                      answerStyle: localAiMsg.answerStyle ?? aligned.answerStyle,
                      creditsRemaining: localAiMsg.creditsRemaining ?? aligned.creditsRemaining,
                      finishReason: localAiMsg.finishReason ?? aligned.finishReason,
                      retryUsed: localAiMsg.retryUsed ?? aligned.retryUsed,
                      qualityRewriteUsed: localAiMsg.qualityRewriteUsed ?? aligned.qualityRewriteUsed,
                      quality: localAiMsg.quality ?? aligned.quality,
                      summaryIncluded: localAiMsg.summaryIncluded ?? aligned.summaryIncluded,
                      persona: localAiMsg.persona ?? aligned.persona,
                      contextUsed: localAiMsg.contextUsed ?? aligned.contextUsed,
                      contextSource: localAiMsg.contextSource ?? aligned.contextSource,
                      contextChars: localAiMsg.contextChars ?? aligned.contextChars,
                      avatarId: localAiMsg.avatarId ?? aligned.avatarId,
                      avatarName: localAiMsg.avatarName ?? aligned.avatarName,
                      avatarTitle: localAiMsg.avatarTitle ?? aligned.avatarTitle,
                      avatarCreditCost: localAiMsg.avatarCreditCost ?? aligned.avatarCreditCost,
                      errorCode: localAiMsg.errorCode ?? aligned.errorCode,
                      opener: localAiMsg.opener ?? aligned.opener,
                      toolLoopExceeded: localAiMsg.toolLoopExceeded ?? aligned.toolLoopExceeded,
                      agentic: localAiMsg.agentic ?? aligned.agentic,
                      planSteps: localAiMsg.planSteps ?? aligned.planSteps,
                      reflections: localAiMsg.reflections ?? aligned.reflections,
                      agentRounds: localAiMsg.agentRounds ?? aligned.agentRounds,
                      toolTrajectory: localAiMsg.toolTrajectory ?? aligned.toolTrajectory,
                    };
                  }
                  return aligned;
                });
                return { ...backendChat, messages: merged };
              }
              return { ...backendChat, messages: backendChat.messages.map(mergeLocal) };
            });
          }
        } catch (e) {
          console.warn('Post-stream chat refetch failed:', e);
        } finally {
          setIsFinalizing(false);
        }
      }
      loadChats();
      setAttachments([]);
    } catch (err) {
      console.error(err);
      const isNetworkError = err instanceof TypeError && (err.message === 'Failed to fetch' || err.message.includes('NetworkError') || err.message.includes('fetch'));
      const displayMsg = isNetworkError ? t('chat.networkError') : t('chat.errorSending');
      setActiveChat(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === aiMsgId ? { ...m, text: '', error: true, errorMessage: displayMsg } : m)
      } : null);
      toastError(displayMsg);
    } finally {
      setIsSending(false);
      setThinkingData(null);
    }
  }, [activeChatId, loadChats, user, isSending, isGuest, t, toastError, language, attachments, selectedAvatarId, setSelectedAvatarId, updateCredits]);

  const createNewChat = useCallback(async (initialMessage?: string, pageContextSource?: ChatPageContextSource) => {
    if (isGuest) return 'guest-session';
    if (!user?.id) return null;
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const isDefaultAvatar = !selectedAvatarId || selectedAvatarId === DEFAULT_AVATAR_ID;
    const guide = !isDefaultAvatar ? avatars.find(a => a.avatarId === selectedAvatarId) : null;
    const welcomeText = guide?.name
      ? t('chat.guideWelcome', { name: guide.name })
      : t('chat.naviWelcome');
    const tempChat: Chat = {
      id: tempId,
      userEmail: user.email || '',
      title: truncateCodePoints(initialMessage ?? '', 30) || t('chat.newConversation'),
      messages: [{
        id: generateUUID(),
        type: 'ai',
        text: welcomeText,
        avatarId: guide ? selectedAvatarId : null,
        avatarName: guide?.name,
        avatarTitle: guide?.title,
        createdAt: now
      }],
      averageRating: null,
      createdAt: now,
      updatedAt: now
    };
    setActiveChat(tempChat);
    setActiveChatId(tempId);
    if (initialMessage) sendMessage(initialMessage, tempId, pageContextSource);
    return tempId;
  }, [user, sendMessage, isGuest, t, selectedAvatarId, avatars]);

  const rateMessage = useCallback(async (messageId: string, rating: number, tags?: string[], comment?: string) => {
    if (isGuest || !activeChatId || activeChatId.startsWith('temp-')) return;
    try {
      const res = await clientFetch(`/api/chat/${activeChatId}/rate`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messageId, rating, feedbackTags: tags, feedbackComment: comment }) 
      });
      if (!res.ok) throw new Error('Rating failed');
      success(t('chat.ratingSuccess'));
    } catch (e) {
      console.error('Rate message error:', e);
      toastError(t('chat.ratingError'));
    }
  }, [activeChatId, isGuest, success, toastError, t]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    if (isGuest || !activeChatId || activeChatId.startsWith('temp-') || isSending) return;
    setIsSending(true);

    // Preserve the avatar that originally produced this message so a regenerate
    // doesn't silently switch personas (per backend handoff). Fall back to the
    // currently selected avatar if the historical message has no avatarId.
    let avatarIdForRegen: string | undefined;
    setActiveChat(prev => {
      if (!prev) return null;
      const target = prev.messages.find(m => m.id === messageId);
      avatarIdForRegen = target?.avatarId ?? selectedAvatarId ?? undefined;
      return {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', rating: null, opener: undefined, toolLoopExceeded: undefined, planSteps: undefined, reflections: undefined, agentRounds: undefined, toolTrajectory: undefined, agentic: undefined } : m),
      };
    });

    try {
      const res = await clientFetch(`/api/chat/${activeChatId}/message/${messageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          ...(avatarIdForRegen ? { avatarId: avatarIdForRegen } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Regenerate failed');
      const metadata = data.metadata || {};
      setActiveChat(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? {
          ...m,
          ...data.message,
          suggestedQuestions: metadata.suggestedQuestions ?? m.suggestedQuestions,
          topic: metadata.topic ?? m.topic,
          intent: metadata.intent ?? m.intent,
          answerStyle: metadata.answerStyle ?? m.answerStyle,
          creditsRemaining: metadata.creditsRemaining ?? m.creditsRemaining,
          finishReason: metadata.finishReason ?? m.finishReason,
          retryUsed: metadata.retryUsed ?? m.retryUsed,
          qualityRewriteUsed: metadata.qualityRewriteUsed ?? m.qualityRewriteUsed,
          quality: metadata.quality ?? m.quality,
          summaryIncluded: metadata.summaryIncluded ?? m.summaryIncluded,
          persona: metadata.persona ?? m.persona,
          errorCode: metadata.errorCode ?? m.errorCode,
          toolLoopExceeded: typeof metadata.toolLoopExceeded === 'boolean' ? metadata.toolLoopExceeded : m.toolLoopExceeded,
          agentic: typeof metadata.agentic === 'boolean' ? metadata.agentic : m.agentic,
          planSteps: Array.isArray(metadata.planSteps) ? metadata.planSteps : m.planSteps,
          reflections: Array.isArray(metadata.reflections) ? metadata.reflections : m.reflections,
          agentRounds: typeof metadata.agentRounds === 'number' ? metadata.agentRounds : m.agentRounds,
          toolTrajectory: Array.isArray(metadata.toolTrajectory) ? metadata.toolTrajectory : m.toolTrajectory,
        } : m),
      } : null);
      if (typeof metadata.creditsRemaining === 'number') {
        updateCredits(metadata.creditsRemaining);
      }
      loadChats();
    } catch (e) {
      console.error('Regenerate message error:', e);
      toastError(t('chat.errorSending'));
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, isGuest, isSending, language, loadChats, toastError, t, selectedAvatarId, updateCredits]);

  const retryMessage = useCallback(async (messageId: string) => {
    if (isGuest || isSending) return;
    setActiveChat(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, error: false, errorMessage: undefined } : m)
    } : null);
    await regenerateMessage(messageId);
  }, [isGuest, isSending, regenerateMessage]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (isGuest) return;
    try {
      const res = await clientFetch(`/api/chat/${chatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChat(null);
        setActiveChatId(null);
      }
      success(t('chat.deleteSuccess'));
    } catch (e) {
      console.error('Delete chat error:', e);
      toastError(t('chat.deleteError'));
    }
  }, [isGuest, activeChatId, success, toastError, t]);

  const addAttachment = useCallback((file: File) => {
    const attachment: FileAttachment = {
      id: generateUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
    };
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(prev => prev.map(a => a.id === attachment.id ? { ...a, preview: e.target?.result as string } : a));
      };
      reader.readAsDataURL(file);
    }
    setAttachments(prev => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const resetChat = useCallback(() => {
    setActiveChat(null);
    setActiveChatId(null);
    setPaywall(null);
  }, []);

  const clearPaywall = useCallback(() => {
    setPaywall(null);
  }, []);

  const loadAvatars = useCallback(async () => {
    if (isGuest) return;
    setIsLoadingAvatars(true);
    try {
      const lang = language || 'en';
      const res = await clientFetch(`/api/chat/avatars?lang=${encodeURIComponent(lang)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load avatars');
      
      const getLocalizedValue = (key: string, fallbackVal: string) => {
        const val = t(key);
        return val === key ? fallbackVal : val;
      };

      const list: ChatAvatar[] = Array.isArray(data.avatars) ? data.avatars : [];
      
      const mappedList = list.map(avatar => {
        if (avatar.avatarId === 'spiritual_guide') {
          return {
            ...avatar,
            name: getLocalizedValue('chat.avatars.spiritual_guide.name', avatar.name || 'Anand'),
            title: getLocalizedValue('chat.avatars.spiritual_guide.title', avatar.title || 'Health Guide'),
            description: getLocalizedValue('chat.avatars.spiritual_guide.description', avatar.description || 'Gain insights into your health and well-being.')
          };
        }
        if (avatar.avatarId === 'finance_mentor') {
          return {
            ...avatar,
            name: getLocalizedValue('chat.avatars.finance_mentor.name', avatar.name || 'Vidya'),
            title: getLocalizedValue('chat.avatars.finance_mentor.title', avatar.title || 'Finance Guide'),
            description: getLocalizedValue('chat.avatars.finance_mentor.description', avatar.description || 'Optimize your wealth and financial stability.')
          };
        }
        return avatar;
      });

      setAvatars(mappedList);

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AVATAR_STORAGE_KEY);
        const activeId = (stored && mappedList.some(a => a.avatarId === stored)) ? stored : DEFAULT_AVATAR_ID;
        if (stored && !mappedList.some(a => a.avatarId === stored)) {
          localStorage.removeItem(AVATAR_STORAGE_KEY);
        }
        setSelectedAvatarIdState(activeId);
      }
    } catch (err) {
      console.warn('Failed to load avatar catalog:', err);
    } finally {
      setIsLoadingAvatars(false);
    }
  }, [isGuest, language, t]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (isGuest || !activeChatId || isSending) return;
    if (!newText.trim()) return;

    setActiveChat(prev => {
      if (!prev) return null;
      const msgIdx = prev.messages.findIndex(m => m.id === messageId);
      if (msgIdx === -1) return prev;
      const original = prev.messages[msgIdx];
      const updatedMessages = prev.messages.map((m, idx) => {
        if (idx === msgIdx) {
          return { ...m, text: newText.trim(), edited: true, originalText: original.originalText || original.text };
        }
        if (idx === msgIdx + 1 && m.type === 'ai') {
          return { ...m, text: '', error: false, errorMessage: undefined };
        }
        return m;
      });
      return { ...prev, messages: updatedMessages };
    });

    try {
      await sendMessage(newText.trim());
    } catch (e) {
      console.error('Edit message failed:', e);
      toastError(t('chat.errorSending'));
    }
  }, [activeChatId, isGuest, isSending, sendMessage, toastError, t]);

  const deleteMessage = useCallback((messageId: string) => {
    setActiveChat(prev => {
      if (!prev) return null;
      const msgIdx = prev.messages.findIndex(m => m.id === messageId);
      if (msgIdx === -1) return prev;
      const msg = prev.messages[msgIdx];
      const updatedMessages = prev.messages.filter((m, idx) => {
        if (idx === msgIdx) return false;
        if (idx === msgIdx + 1 && msg.type === 'user' && m.type === 'ai' && !m.pinned) return false;
        return true;
      });
      return { ...prev, messages: updatedMessages };
    });
  }, []);

  const togglePin = useCallback((messageId: string) => {
    setActiveChat(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, pinned: !m.pinned } : m),
      };
    });
  }, []);

  // Load initial chats
  useEffect(() => {
    if (!initialLoadDone.current && user?.id && !isGuest) {
      initialLoadDone.current = true;
      loadChats();
    }
  }, [user?.id, loadChats, isGuest]);

  // Load avatars initially and when language or auth state changes
  useEffect(() => {
    if (user?.id && !isGuest) {
      loadAvatars();
    }
  }, [user?.id, loadAvatars, isGuest]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending, isFinalizing, hasMoreChats,
      isGuest, guestTimeRemaining, isGuestExpired, enableGuestMode,
      loadChats, loadMoreChats, selectChat, createNewChat, sendMessage, rateMessage, regenerateMessage, retryMessage, deleteChat, resetChat,
      editMessage, deleteMessage, togglePin,
      inputText, setInputText, attachments, addAttachment, removeAttachment, isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen,
      paywall, clearPaywall,
      thinkingData,
      avatars, selectedAvatarId, setSelectedAvatarId, isLoadingAvatars,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
