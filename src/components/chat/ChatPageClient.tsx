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
  const { 
    isMobileMenuOpen, setIsMobileMenuOpen, isRightPanelOpen, setIsRightPanelOpen, 
    createNewChat, selectChat, isGuest, enableGuestMode, guestTimeRemaining, isGuestExpired 
  } = useChat();

  React.useEffect(() => {
    // 1. Handle Guest Mode from URL
    const mode = searchParams.get('mode');
    if (mode === 'guest') {
      enableGuestMode();
      return;
    }

    // 2. Handle Logged-In User
    if (!user?.email) return;

    // Check if there's a chat ID in the URL
    const chatId = searchParams.get('id');
    if (chatId) {
      selectChat(chatId);
      return;
    }

    // Check for pending message and auto-create chat
    const pendingMsg = localStorage.getItem('astranavi_pending_message');
    if (pendingMsg && pendingMsg.trim()) {
      localStorage.removeItem('astranavi_pending_message');
      createNewChat(pendingMsg);
    }
  }, [user, searchParams, createNewChat, selectChat, enableGuestMode]);

  return (
    <div className="chat-layout relative overflow-hidden">
      {/* Guest Banner */}
      {isGuest && (
        <div className="absolute top-0 left-0 right-0 z-[100] h-10 bg-amber-500/90 backdrop-blur-md flex items-center justify-center gap-4 shadow-lg border-b border-white/10">
          <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
             Preview Mode ✦ Identity Required for Vedic Analysis
          </div>
          <a href="/login" className="px-3 py-1 bg-white text-amber-600 rounded-full text-[10px] font-bold hover:bg-gray-100 transition-colors shadow-sm">Login Now</a>
        </div>
      )}
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      
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
      <div className={`chat-main-area relative z-10 ${isGuest ? 'pt-10' : ''}`}>
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
