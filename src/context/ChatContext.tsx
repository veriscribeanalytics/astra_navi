'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

/* ---------- Types ---------- */
export interface ChatMessage {
  id: string;
  type: 'system' | 'ai' | 'user';
  text: string;
  rating?: number | null;
  insights?: { label: string; value: string }[];
  dasha?: { title: string; rows: { planet: string; fill: string; fillColor?: string; dates: string; active?: boolean }[] };
  createdAt: string;
}

export interface Chat {
  _id: string;
  userEmail: string;
  title: string;
  messages: ChatMessage[];
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  _id: string;
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
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createNewChat: (initialMessage?: string) => Promise<string | null>;
  sendMessage: (text: string, overrideChatId?: string) => Promise<void>;
  rateMessage: (messageId: string, rating: number) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  inputText: string;
  setInputText: (text: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (isOpen: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const initialLoadDone = useRef(false);

  const loadChats = useCallback(async () => {
    if (!user?.email) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(`/api/chat?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.chats) setChats(data.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.email]);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      const data = await res.json();
      if (data.chat) setActiveChat(data.chat);
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, overrideChatId?: string) => {
    let targetId = overrideChatId || activeChatId;
    if (!targetId || !text.trim() || !user?.email) return;
    setIsSending(true);
    const optimisticId = `user-temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      type: 'user',
      text,
      createdAt: new Date().toISOString()
    };

    setActiveChat(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, optimisticMsg] };
    });

    try {
      const startTime = Date.now();
      let responseData;

      if (targetId.startsWith('temp-')) {
        const createRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, title: text.slice(0, 30) }),
        });
        const createData = await createRes.json();
        if (createData.chat) {
          const finalId = createData.chat._id;
          setActiveChatId(finalId);
          const res = await fetch(`/api/chat/${finalId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          responseData = await res.json();
          targetId = finalId;
        } else {
          throw new Error('Failed to instantiate temp chat in DB');
        }
      } else {
        const res = await fetch(`/api/chat/${targetId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        responseData = await res.json();
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
      }

      if (responseData.userMessage && responseData.aiResponse) {
        setActiveChat(prev => {
          if (!prev) return prev;
          const filteredMessages = prev.messages.filter(m => m.id !== optimisticId);
          return {
            ...prev,
            messages: [...filteredMessages, responseData.userMessage, responseData.aiResponse],
          };
        });
        loadChats();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, loadChats, user]);

  const createNewChat = useCallback(async (initialMessage?: string) => {
    if (!user?.email) return null;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'system',
      text: `Session started · Reading your chart${user?.dob ? ` · DOB: ${user.dob}` : ''}`,
      createdAt: now,
    };
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'ai',
      text: `Namaste${user?.name ? ` ${user.name}` : ''} ✦ I'm Navi, your AI Vedic astrologer. Ask me anything about your chart, transits, career, relationships, or timing of events.`,
      createdAt: now,
    };

    const tempChat: Chat = {
      _id: tempId,
      userEmail: user.email,
      title: initialMessage ? initialMessage.slice(0, 30) : 'New conversation',
      messages: [systemMessage, welcomeMessage],
      averageRating: null,
      createdAt: now,
      updatedAt: now,
    };

    setActiveChat(tempChat);
    setActiveChatId(tempId);

    if (initialMessage) {
        sendMessage(initialMessage, tempId);
    }

    return tempId;
  }, [user, sendMessage]);

  const rateMessage = useCallback(async (messageId: string, rating: number) => {
    if (!activeChatId || activeChatId.startsWith('temp-')) return;

    setActiveChat(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, rating } : m),
      };
    });

    try {
      const res = await fetch(`/api/chat/${activeChatId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
      const data = await res.json();
      setActiveChat(prev => {
        if (!prev) return prev;
        return { ...prev, averageRating: data.averageRating ?? prev.averageRating };
      });
    } catch (err) {
      console.error('Failed to rate message:', err);
    }
  }, [activeChatId]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c._id !== chatId));
        if (activeChatId === chatId) {
          setActiveChatId(null);
          setActiveChat(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }, [activeChatId]);

  // Load chats on mount
  useEffect(() => {
    if (!initialLoadDone.current && user?.email) {
      initialLoadDone.current = true;
      loadChats();
    }
  }, [user?.email, loadChats]);

  return (
    <ChatContext.Provider value={{
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending,
      loadChats, selectChat, createNewChat, sendMessage, rateMessage, deleteChat,
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
