'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateUUID } from '@/lib/uuid';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/hooks';

/* ---------- Types ---------- */
export interface ChatMessage {
  id: string;
  type: 'system' | 'ai' | 'user';
  text: string;
  rating?: number | null;
  feedbackTags?: string[];
  feedbackComment?: string;
  insights?: { label: string; value: string }[];
  dasha?: { title: string; rows: { planet: string; fill: string; fillColor?: string; dates: string; active?: boolean }[] };
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
  deleteChat: (chatId: string) => Promise<void>;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (isOpen: boolean) => void;
  resetChat: () => void;
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
  const [inputText, setInputText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
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
    
    const userMessage: ChatMessage = { id: userMsgId, type: 'user', text: text.trim(), createdAt: now };
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
        body: JSON.stringify({ text, language }),
        signal: abortController.signal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      
      // Phase 6.3: Debounce re-renders during streaming
      let lastUpdate = 0;
      const updateInterval = 50; // ms

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Final update to ensure everything is rendered
            setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m) } : null);
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim().startsWith('data: ')) continue;
            const dataStr = line.trim().slice(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullText += data.token;
                
                const now = Date.now();
                if (now - lastUpdate > updateInterval) {
                  setActiveChat(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m) } : null);
                  lastUpdate = now;
                }
              }
            } catch (e) {
              console.warn('Failed to parse stream token:', dataStr, e);
            }
          }
        }
      }
      loadChats();
    } catch (err) {
      console.error(err);
      toastError(t('chat.errorSending'));
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, loadChats, user, isSending, isGuest, t, toastError, language]);

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

  const resetChat = useCallback(() => {
    setActiveChat(null);
    setActiveChatId(null);
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current && user?.email && !isGuest) {
      initialLoadDone.current = true;
      loadChats();
    }
  }, [user?.email, loadChats, isGuest]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending, hasMoreChats,
      isGuest, guestTimeRemaining, isGuestExpired, enableGuestMode,
      loadChats, loadMoreChats, selectChat, createNewChat, sendMessage, rateMessage, deleteChat, resetChat,
      inputText, setInputText, isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen
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
