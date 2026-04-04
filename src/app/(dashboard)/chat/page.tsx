import type { Metadata } from 'next';
import ChatPageClient from '@/components/chat/ChatPageClient';

export const metadata: Metadata = {
  title: 'AI Chat — Astra Navi',
  description: 'Chat with Navi, your AI Vedic astrologer. Get personalized insights about your birth chart, career, relationships, and timing of events.',
};

export default function ChatPage() {
  return <ChatPageClient />;
}
