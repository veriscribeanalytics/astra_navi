'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateUUID } from '@/lib/uuid';

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
  hasMoreChats: boolean;
  loadChats: () => Promise<void>;
  loadMoreChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createNewChat: (initialMessage?: string) => Promise<string | null>;
  sendMessage: (text: string, overrideChatId?: string) => Promise<void>;
  rateMessage: (messageId: string, rating: number) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
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
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const loadChats = useCallback(async () => {
    if (!user?.email) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(`/api/chat?email=${encodeURIComponent(user.email)}&limit=20`);
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        setHasMoreChats(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.email]);

  const loadMoreChats = useCallback(async () => {
    if (!user?.email || !hasMoreChats || !nextCursor || isLoadingChats) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(`/api/chat?email=${encodeURIComponent(user.email)}&limit=20&cursor=${nextCursor}`);
      const data = await res.json();
      if (data.chats) {
        setChats(prev => [...prev, ...data.chats]);
        setHasMoreChats(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load more chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user?.email, hasMoreChats, nextCursor, isLoadingChats]);

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
    
    // Request deduplication: prevent duplicate sends
    if (isSending) return;
    
    setIsSending(true);
    
    const now = new Date().toISOString();
    const userMsgId = generateUUID();
    const aiMsgId = generateUUID();
    
    const userMessage: ChatMessage = {
      id: userMsgId,
      type: 'user',
      text: text.trim(),
      createdAt: now
    };

    const aiPlaceholder: ChatMessage = {
      id: aiMsgId,
      type: 'ai',
      text: '',
      createdAt: now
    };

    setActiveChat(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, userMessage, aiPlaceholder] };
    });

    try {
      if (targetId.startsWith('temp-')) {
        const createRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, title: text.slice(0, 30) }),
        });
        const createData = await createRes.json();
        if (createData.chat) {
          targetId = createData.chat._id;
          setActiveChatId(targetId);
        } else {
          throw new Error('Failed to instantiate temp chat in DB');
        }
      }

      const res = await fetch(`/api/chat/${targetId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullText += chunk;

          setActiveChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map(m => 
                m.id === aiMsgId ? { ...m, text: fullText } : m
              )
            };
          });
        }
      }

      loadChats();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      
      let errorMsg = `I apologize, but I've encountered a celestial disturbance: ${err.message || 'Unknown error'}. Please try again.`;
      
      if (err.message?.includes('Birth Profile')) {
        errorMsg = "Namaste! To give you an accurate reading, I need your birth date, time, and place. Please update your [Celestial Profile](/profile) first so I can align with your stars.";
      }
      
      setActiveChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === aiMsgId ? { ...m, text: errorMsg } : m
          )
        };
      });
    } finally {

      setIsSending(false);
    }
  }, [activeChatId, loadChats, user, isSending]);


  const createNewChat = useCallback(async (initialMessage?: string) => {
    if (!user?.email) return null;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const systemMessage: ChatMessage = {
      id: generateUUID(),
      type: 'system',
      text: `Session started · Reading your chart${user?.dob ? ` · DOB: ${user.dob}` : ''}`,
      createdAt: now,
    };
    const welcomeMessage: ChatMessage = {
      id: generateUUID(),
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
      chats, activeChat, activeChatId, isLoadingChats, isLoadingMessages, isSending, hasMoreChats,
      loadChats, loadMoreChats, selectChat, createNewChat, sendMessage, rateMessage, deleteChat,
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
