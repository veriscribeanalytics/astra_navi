'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateUUID } from '@/lib/uuid';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/hooks';
import { PaywallData } from '@/types/paywall';

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
  error?: boolean;
  errorMessage?: string;
  pinned?: boolean;
  edited?: boolean;
  originalText?: string;
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
  createNewChat: (initialMessage?: string) => Promise<string | null>;
  sendMessage: (text: string, overrideChatId?: string) => Promise<void>;
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
  const [mode, setMode] = useState<"quick" | "normal" | "deep">("normal");
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const sendMessage = useCallback(async (text: string, overrideChatId?: string) => {
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
    
    const userMessage: ChatMessage = { id: userMsgId, type: 'user', text: text.trim(), attachments: attachments.length > 0 ? [...attachments] : undefined, createdAt: now };
    const aiPlaceholder: ChatMessage = { id: aiMsgId, type: 'ai', text: '', createdAt: now };

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
        body: JSON.stringify({ text, language, mode }),
        signal: abortController.signal,
      });

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
          const { done, value } = await reader.read();
          if (done) {
            setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => (m.id === aiMsgId || m.id === persistedAiMsgId) ? { ...m, text: fullText } : m) } : null);
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
              streamDone = true;
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (currentEventName === 'metadata') {
                if (typeof data.aiMessageId === 'string' && data.aiMessageId) {
                  persistedAiMsgId = data.aiMessageId;
                }
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
              if (backendAiMsg && (localAiMsg.suggestedQuestions || localAiMsg.topic || localAiMsg.intent || localAiMsg.answerStyle || localAiMsg.mode || localAiMsg.creditsRemaining !== undefined || localAiMsg.finishReason || localAiMsg.retryUsed !== undefined || localAiMsg.qualityRewriteUsed !== undefined || localAiMsg.quality)) {
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
    }
  }, [activeChatId, loadChats, user, isSending, isGuest, t, toastError, language, mode, attachments]);

  const createNewChat = useCallback(async (initialMessage?: string) => {
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
    if (initialMessage) sendMessage(initialMessage, tempId);
    return tempId;
  }, [user, sendMessage, isGuest, t]);

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
    setActiveChat(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', rating: null } : m),
    } : null);
    try {
      const res = await clientFetch(`/api/chat/${activeChatId}/message/${messageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, mode }),
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
        } : m),
      } : null);
      loadChats();
    } catch (e) {
      console.error('Regenerate message error:', e);
      toastError(t('chat.errorSending'));
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, isGuest, isSending, language, mode, loadChats, toastError, t]);

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

  useEffect(() => {
    if (!initialLoadDone.current && user?.email && !isGuest) {
      initialLoadDone.current = true;
      loadChats();
    }
  }, [user?.email, loadChats, isGuest]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending, isFinalizing, hasMoreChats,
      isGuest, guestTimeRemaining, isGuestExpired, enableGuestMode,
      loadChats, loadMoreChats, selectChat, createNewChat, sendMessage, rateMessage, regenerateMessage, retryMessage, deleteChat, resetChat,
      editMessage, deleteMessage, togglePin,
      inputText, setInputText, attachments, addAttachment, removeAttachment, mode, setMode, isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen,
      paywall, clearPaywall
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
