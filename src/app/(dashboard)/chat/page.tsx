import type { Metadata } from 'next';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ChatDetailPanel from '@/components/chat/ChatDetailPanel';

export const metadata: Metadata = {
  title: 'AI Chat — Astra Navi',
  description: 'Chat with Navi, your AI Vedic astrologer. Get personalized insights about your birth chart, career, relationships, and timing of events.',
};

export default function ChatPage() {
  return (
    <div className="chat-layout">
      {/* Left Sidebar — Recent Chats + Topics */}
      <ChatSidebar />

      {/* Center — Chat Area */}
      <div className="chat-main-area">
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </div>

      {/* Right Sidebar — Person Detail */}
      <ChatDetailPanel />
    </div>
  );
}
