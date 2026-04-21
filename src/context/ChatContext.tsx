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
  feedbackTags?: string[];
  feedbackComment?: string;
  insights?: { label: string; value: string }[];
  dasha?: { title: string; rows: { planet: string; fill: string; fillColor?: string; dates: string; active?: boolean }[] };
  createdAt: string;
}

export interface Chat {
  id: string; // Changed from _id to id for PostgreSQL consistency
  userEmail: string;
  title: string;
  messages: ChatMessage[];
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSummary {
  id: string; // Changed from _id to id
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
  rateMessage: (messageId: string, rating: number, feedbackTags?: string[], feedbackComment?: string) => Promise<void>;
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
  const { user, refreshUser } = useAuth();
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
  const previousUserEmail = useRef<string | null>(null);

  const loadChats = useCallback(async () => {
    if (!user?.email) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(`/api/chat?limit=20`);
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
  }, [user?.email]);

  const loadMoreChats = useCallback(async () => {
    if (!user?.email || !nextCursor || isLoadingChats) return;
    setIsLoadingChats(true);
    try {
      const res = await fetch(`/api/chat?limit=20&cursor=${nextCursor}`);
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
  }, [user?.email, nextCursor, isLoadingChats]);

  const selectChat = useCallback(async (chatId: string) => {
    if (!chatId) return;
    setActiveChatId(chatId);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load chat');
      if (data.chat) setActiveChat(data.chat);
    } catch (err: unknown) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, overrideChatId?: string) => {
    let targetId = overrideChatId || activeChatId;
    if (!targetId || !text.trim() || !user?.email) {
        console.warn("[Chat] sendMessage blocked: missing targetId, text or userEmail");
        return;
    }
    
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

    // Optimistically update UI
    setActiveChat(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, userMessage, aiPlaceholder] };
    });

    try {
      // PROD FIX: If targetId is temp, create it in DB first sequentially
      if (targetId.startsWith('temp-')) {
        const createRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 30) }),
        });
        const createData = await createRes.json();
        if (createData.chat && createData.chat.id) {
          targetId = createData.chat.id;
          setActiveChatId(targetId);
          // Sync existing state with real ID
          setActiveChat(prev => prev ? { ...prev, id: targetId as string } : null);
        } else {
          throw new Error('Could not synchronize celestial conversation with server.');
        }
      }

      const res = await fetch(`/api/chat/${targetId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'The stars are currently obscured.');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            const dataStr = trimmedLine.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullText += data.token;
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
            } catch (e) {
              console.error("[Chat] SSE Parse Error:", e, dataStr);
            }
          }
        }
      }

      // Handle profile refreshes if specific questions were asked
      const DASHBOARD_RASHI_QUERY = 'Tell me my Rashi (Moon Sign) and Sun Sign based on my birth chart.';
      if (text === DASHBOARD_RASHI_QUERY) {
        fetch('/api/user/profile')
          .then(r => r.json())
          .then(d => { if (d.user) refreshUser(d.user); })
          .catch(() => {});
      }

      loadChats();
    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown celestial disturbance';
      let errorMsg = `Celestial disturbance: ${errorMessage}. Please try again.`;
      
      if (errorMessage.includes('birth details') || errorMessage.includes('Profile')) {
        errorMsg = "Namaste! To give you an accurate reading, I need your birth coordinates. Please update your [Celestial Profile](/profile) first.";
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
  }, [activeChatId, loadChats, user, isSending, refreshUser]);


  const createNewChat = useCallback(async (initialMessage?: string) => {
    if (!user?.email) return null;

    // Use a temp ID for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    const welcomeMessage: ChatMessage = {
      id: generateUUID(),
      type: 'ai',
      text: `Namaste${user?.name ? ` ${user.name.split(' ')[0]}` : ''} ✦ I'm Navi, your AI Vedic astrologer. Ask me anything about your chart, transits, career, or destiny.`,
      createdAt: now,
    };

    const tempChat: Chat = {
      id: tempId,
      userEmail: user.email,
      title: initialMessage ? initialMessage.slice(0, 30) : 'New conversation',
      messages: [welcomeMessage],
      averageRating: null,
      createdAt: now,
      updatedAt: now,
    };

    setActiveChat(tempChat);
    setActiveChatId(tempId);

    if (initialMessage) {
        // This will now handle the temp -> real ID transition internally
        sendMessage(initialMessage, tempId);
    }

    return tempId;
  }, [user, sendMessage]);

  const rateMessage = useCallback(async (messageId: string, rating: number, feedbackTags?: string[], feedbackComment?: string) => {
    if (!activeChatId || activeChatId.startsWith('temp-')) return;

    setActiveChat(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(m => 
          m.id === messageId ? { ...m, rating, feedbackTags, feedbackComment } : m
        ),
      };
    });

    try {
      const res = await fetch(`/api/chat/${activeChatId}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating, feedbackTags, feedbackComment }),
      });
      const data = await res.json();
      if (data.averageRating !== undefined) {
        setActiveChat(prev => prev ? { ...prev, averageRating: data.averageRating } : null);
      }
    } catch (err: unknown) {
      console.error('Failed to rate message:', err);
    }
  }, [activeChatId]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) {
          setActiveChatId(null);
          setActiveChat(null);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to delete chat:', err);
    }
  }, [activeChatId]);

  // Handle user identity changes
  useEffect(() => {
    const currentEmail = user?.email || null;
    if (previousUserEmail.current !== null && previousUserEmail.current !== currentEmail) {
      setChats([]);
      setActiveChat(null);
      setActiveChatId(null);
      setHasMoreChats(false);
      setNextCursor(null);
      setInputText('');
      initialLoadDone.current = false;
    }
    previousUserEmail.current = currentEmail;
  }, [user?.email]);

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
