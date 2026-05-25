'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateUUID } from '@/lib/uuid';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/hooks';
import { PaywallData } from '@/types/paywall';
import type { ChatPageContextSource } from '@/lib/schemas';
import type { ChatAvatar } from '@/types/avatar';
import type { FamilyCompatibilityResponse, FamilyRelationshipType } from '@/types/family';

const AVATAR_STORAGE_KEY = 'astranavi_selected_avatar';
const DEFAULT_AVATAR_ID = 'navi';
const VALID_IDS = ['navi', 'career_mentor', 'relationship_guide', 'spiritual_guide', 'astro_sage', 'finance_mentor'];

const FALLBACK_DEFAULT_MODES: Record<string, "quick" | "normal" | "deep"> = {
  navi: 'quick',
  relationship_guide: 'normal',
  career_mentor: 'normal',
  finance_mentor: 'normal',
  spiritual_guide: 'normal',
  astro_sage: 'deep',
};

const readStoredAvatar = (): string => {
  if (typeof window === 'undefined') return DEFAULT_AVATAR_ID;
  try {
    const v = localStorage.getItem(AVATAR_STORAGE_KEY);
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

export interface PendingChatAction {
  type: 'run_compatibility';
  memberId: number;
  memberName: string;
  relationshipType: FamilyRelationshipType | string;
  creditCost: number;
}

export interface ResolvedChatAction {
  status: 'running' | 'done' | 'error';
  result?: FamilyCompatibilityResponse;
  errorMessage?: string;
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
  mode?: "quick" | "normal" | "deep";
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
  /** AI proposals the user can approve inline (e.g. paid compatibility run). */
  pendingActions?: PendingChatAction[];
  /** Backend signals the tool-use loop got stuck — UI shows fallback copy. */
  toolLoopExceeded?: boolean;
  /** Local-only: per-pendingAction state once the user has tapped approve. */
  resolvedActions?: Record<number, ResolvedChatAction>;
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
  mode?: ChatMessage['mode'];
  model?: string;
  answerStyle?: string;
  /** Tool names from the new `tool_use` SSE event. Non-empty means the AI is
   *  consulting family data — UI swaps to a family-flavoured thinking copy. */
  tools?: string[];
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
  mode: "quick" | "normal" | "deep";
  setMode: React.Dispatch<React.SetStateAction<"quick" | "normal" | "deep">>;
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
  resolvePendingAction: (messageId: string, memberId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { success, error: toastError } = useToast();
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
  const [mode, setModeState] = useState<"quick" | "normal" | "deep">("normal");
  const [userHasManuallyChangedMode, setUserHasManuallyChangedMode] = useState(false);

  const setMode = useCallback((action: React.SetStateAction<"quick" | "normal" | "deep">) => {
    setModeState(action);
    setUserHasManuallyChangedMode(true);
  }, []);

  const [thinkingData, setThinkingData] = useState<ThinkingData | null>(null);
  const [avatars, setAvatars] = useState<ChatAvatar[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  const [selectedAvatarId, setSelectedAvatarIdState] = useState<string>(readStoredAvatar);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setSelectedAvatarId = useCallback((avatarId: string) => {
    setSelectedAvatarIdState(avatarId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
      } catch {}
    }
    if (!userHasManuallyChangedMode) {
      const avatar = avatars.find(a => a.avatarId === avatarId);
      const resolvedMode = avatar?.defaultMode || FALLBACK_DEFAULT_MODES[avatarId] || 'normal';
      setModeState(resolvedMode);
    }
  }, [avatars, userHasManuallyChangedMode]);

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
    if (!user?.email || isGuest) return;
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
  }, [user?.email, isGuest]);

  const loadMoreChats = useCallback(async () => {
    if (!user?.email || !nextCursor || isLoadingChats || isGuest) return;
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
  }, [user?.email, nextCursor, isLoadingChats, isGuest]);

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

    if (!targetId || !text.trim() || !user?.email) return;
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
        const createRes = await clientFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 30), language }),
        });
        const createData = await createRes.json();
        if (createData.chat?.id) {
          targetId = createData.chat.id;
          setActiveChatId(targetId);
          setActiveChat(prev => prev ? { ...prev, id: targetId as string } : null);
        }
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
          mode,
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

      let lastUpdate = 0;
      const updateInterval = 50;

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
                  mode: data.mode ?? undefined,
                  model: data.model ?? undefined,
                  answerStyle: data.answerStyle ?? undefined,
                }));
              } else if (currentEventName === 'tool_use') {
                // The AI is consulting family/relationship data. We just track
                // the tool names; the indicator decides what copy to show.
                const tools = Array.isArray(data.tools) ? (data.tools as string[]) : [];
                setThinkingData(prev => ({ ...(prev ?? {}), tools }));
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
                    mode: data.mode ?? m.mode,
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
                    pendingActions: Array.isArray(data.pendingActions) ? data.pendingActions : m.pendingActions,
                    toolLoopExceeded: typeof data.toolLoopExceeded === 'boolean' ? data.toolLoopExceeded : m.toolLoopExceeded,
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
              } else if (data.token) {
                fullText += data.token;
                const now = Date.now();
                if (now - lastUpdate > updateInterval) {
                  setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, text: fullText } : m) } : null);
                  lastUpdate = now;
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
              if (backendAiMsg && (localAiMsg.suggestedQuestions || localAiMsg.topic || localAiMsg.intent || localAiMsg.answerStyle || localAiMsg.mode || localAiMsg.creditsRemaining !== undefined || localAiMsg.finishReason || localAiMsg.retryUsed !== undefined || localAiMsg.qualityRewriteUsed !== undefined || localAiMsg.quality || localAiMsg.summaryIncluded !== undefined || localAiMsg.persona || localAiMsg.errorCode || localAiMsg.contextUsed !== undefined || localAiMsg.contextSource || localAiMsg.contextChars !== undefined || localAiMsg.avatarId || localAiMsg.avatarName || localAiMsg.avatarTitle || localAiMsg.avatarCreditCost !== undefined)) {
                const merged = backendChat.messages.map(m => {
                  if (m.id === backendAiMsg.id) {
                    return {
                      ...m,
                      suggestedQuestions: localAiMsg.suggestedQuestions ?? m.suggestedQuestions,
                      topic: localAiMsg.topic ?? m.topic,
                      intent: localAiMsg.intent ?? m.intent,
                      answerStyle: localAiMsg.answerStyle ?? m.answerStyle,
                      mode: localAiMsg.mode ?? m.mode,
                      creditsRemaining: localAiMsg.creditsRemaining ?? m.creditsRemaining,
                      finishReason: localAiMsg.finishReason ?? m.finishReason,
                      retryUsed: localAiMsg.retryUsed ?? m.retryUsed,
                      qualityRewriteUsed: localAiMsg.qualityRewriteUsed ?? m.qualityRewriteUsed,
                      quality: localAiMsg.quality ?? m.quality,
                      summaryIncluded: localAiMsg.summaryIncluded ?? m.summaryIncluded,
                      persona: localAiMsg.persona ?? m.persona,
                      contextUsed: localAiMsg.contextUsed ?? m.contextUsed,
                      contextSource: localAiMsg.contextSource ?? m.contextSource,
                      contextChars: localAiMsg.contextChars ?? m.contextChars,
                      avatarId: localAiMsg.avatarId ?? m.avatarId,
                      avatarName: localAiMsg.avatarName ?? m.avatarName,
                      avatarTitle: localAiMsg.avatarTitle ?? m.avatarTitle,
                      avatarCreditCost: localAiMsg.avatarCreditCost ?? m.avatarCreditCost,
                      errorCode: localAiMsg.errorCode ?? m.errorCode,
                    };
                  }
                  return m;
                });
                return { ...backendChat, messages: merged };
              }
              return backendChat;
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
  }, [activeChatId, loadChats, user, isSending, isGuest, t, toastError, language, mode, attachments, selectedAvatarId, setSelectedAvatarId]);

  const createNewChat = useCallback(async (initialMessage?: string, pageContextSource?: ChatPageContextSource) => {
    if (isGuest) return 'guest-session';
    if (!user?.email) return null;
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const tempChat: Chat = {
      id: tempId,
      userEmail: user.email,
      title: initialMessage?.slice(0,30) || t('chat.newConversation'),
      messages: [{
        id: generateUUID(),
        type: 'ai',
        text: t('chat.naviWelcome'),
        createdAt: now
      }],
      averageRating: null,
      createdAt: now,
      updatedAt: now
    };
    setActiveChat(tempChat);
    setActiveChatId(tempId);
    setUserHasManuallyChangedMode(false);
    if (initialMessage) sendMessage(initialMessage, tempId, pageContextSource);
    return tempId;
  }, [user, sendMessage, isGuest, t, setUserHasManuallyChangedMode]);

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
        messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', rating: null } : m),
      };
    });

    try {
      const res = await clientFetch(`/api/chat/${activeChatId}/message/${messageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          mode,
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
          mode: metadata.mode ?? m.mode,
          creditsRemaining: metadata.creditsRemaining ?? m.creditsRemaining,
          finishReason: metadata.finishReason ?? m.finishReason,
          retryUsed: metadata.retryUsed ?? m.retryUsed,
          qualityRewriteUsed: metadata.qualityRewriteUsed ?? m.qualityRewriteUsed,
          quality: metadata.quality ?? m.quality,
          summaryIncluded: metadata.summaryIncluded ?? m.summaryIncluded,
          persona: metadata.persona ?? m.persona,
          errorCode: metadata.errorCode ?? m.errorCode,
        } : m),
      } : null);
      loadChats();
    } catch (e) {
      console.error('Regenerate message error:', e);
      toastError(t('chat.errorSending'));
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, isGuest, isSending, language, mode, loadChats, toastError, t, selectedAvatarId]);

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
    setUserHasManuallyChangedMode(false);
  }, [setUserHasManuallyChangedMode]);

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
        
        if (!userHasManuallyChangedMode) {
          const avatar = mappedList.find(a => a.avatarId === activeId);
          const resolvedMode = avatar?.defaultMode || FALLBACK_DEFAULT_MODES[activeId] || 'normal';
          setModeState(resolvedMode);
        }
      }
    } catch (err) {
      console.warn('Failed to load avatar catalog:', err);
    } finally {
      setIsLoadingAvatars(false);
    }
  }, [isGuest, language, t, userHasManuallyChangedMode]);

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

  // ── Resolve a pendingAction the AI proposed ──
  // Right now only `run_compatibility` exists; the lookup is by `memberId`.
  // 402s route through the same paywall surface as the chat-send endpoint so
  // the UX feels consistent (PaywallCard pops on either flow).
  const resolvePendingAction = useCallback(async (messageId: string, memberId: number) => {
    const setActionState = (next: ResolvedChatAction) => {
      setActiveChat(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? {
          ...m,
          resolvedActions: { ...(m.resolvedActions ?? {}), [memberId]: next },
        } : m),
      } : null);
    };

    setActionState({ status: 'running' });

    try {
      const res = await clientFetch(
        `/api/family/members/${encodeURIComponent(String(memberId))}/compatibility?lang=${encodeURIComponent(language)}`
      );
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        setActionState({ status: 'done', result: body as FamilyCompatibilityResponse });
        return;
      }

      if (res.status === 402) {
        const paywallData = body.paywall || body.detail?.paywall || body;
        setPaywall(paywallData as PaywallData);
        setActionState({ status: 'error', errorMessage: t('chat.pendingActionError') });
        return;
      }

      const msg = body.error || body.detail || t('chat.pendingActionError');
      setActionState({ status: 'error', errorMessage: msg });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('chat.pendingActionError');
      setActionState({ status: 'error', errorMessage: msg });
    }
  }, [language, t]);

  // Load initial chats
  useEffect(() => {
    if (!initialLoadDone.current && user?.email && !isGuest) {
      initialLoadDone.current = true;
      loadChats();
    }
  }, [user?.email, loadChats, isGuest]);

  // Load avatars initially and when language or auth state changes
  useEffect(() => {
    if (user?.email && !isGuest) {
      loadAvatars();
    }
  }, [user?.email, loadAvatars, isGuest]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending, isFinalizing, hasMoreChats,
      isGuest, guestTimeRemaining, isGuestExpired, enableGuestMode,
      loadChats, loadMoreChats, selectChat, createNewChat, sendMessage, rateMessage, regenerateMessage, retryMessage, deleteChat, resetChat,
      editMessage, deleteMessage, togglePin,
      inputText, setInputText, attachments, addAttachment, removeAttachment, mode, setMode, isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen,
      paywall, clearPaywall,
      thinkingData,
      avatars, selectedAvatarId, setSelectedAvatarId, isLoadingAvatars,
      resolvePendingAction
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
