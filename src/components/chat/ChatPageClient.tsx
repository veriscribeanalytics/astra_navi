'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ChatDetailPanel from '@/components/chat/ChatDetailPanel';

import { useAuth } from '@/context/AuthContext';

const ChatPageClient: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen, createNewChat, selectChat } = useChat();

  React.useEffect(() => {
    if (!user?.email) return;

    // Check if there's a chat ID in the URL
    const chatId = searchParams.get('id');
    if (chatId) {
      selectChat(chatId);
      return;
    }

    // Check for pending message and auto-create chat only if message exists
    const pendingMsg = localStorage.getItem('astranavi_pending_message');
    if (pendingMsg && pendingMsg.trim()) {
      localStorage.removeItem('astranavi_pending_message');
      createNewChat(pendingMsg);
    }
    // If no chatId and no pending message, just show empty chat page (user can select from sidebar or start new)
  }, [user, searchParams, createNewChat, selectChat]);

  return (
    <div className="chat-layout">
      {/* Mobile Overlays */}
      <div 
        className={`sidebar-overlay ${(isMobileMenuOpen || isRightPanelOpen) ? 'active' : ''}`} 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsMobileMenuOpen(false);
            setIsRightPanelOpen(false);
          }
        }}
      />

      {/* Left Sidebar — Recent Chats */}
      <div className={`chat-left-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <ChatSidebar />
      </div>

      {/* Center — Chat Area */}
      <div className="chat-main-area">
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </div>

      {/* Right Sidebar — User Details & Rating */}
      <div className={`chat-right-sidebar ${isRightPanelOpen ? 'mobile-open' : ''}`}>
        <ChatDetailPanel />
      </div>
    </div>
  );
};

export default ChatPageClient;
