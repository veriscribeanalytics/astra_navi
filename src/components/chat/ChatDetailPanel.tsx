'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SidebarSectionLabel from '@/components/ui/SidebarSectionLabel';
import TopicPill from '@/components/ui/TopicPill';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { X, Lock } from 'lucide-react';

const topicPills = [
  { icon: '💼', label: 'Career & Finance' },
  { icon: '💑', label: 'Love & Marriage' },
  { icon: '🏠', label: 'Property & Home' },
  { icon: '🌿', label: 'Health & Wellness' },
  { icon: '✈️', label: 'Travel & Relocation' },
  { icon: '📿', label: 'Remedies & Mantras' },
  { icon: '📅', label: 'Muhurat & Timing' },
  { icon: '🪐', label: 'Current Transits' },
];

/* ---------- Chart Rating Display ---------- */
const ChatRatingDisplay: React.FC<{ rating: number | null }> = ({ rating }) => {
  if (rating == null) return null;

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-px text-secondary text-xs">
        {Array(fullStars).fill(0).map((_, i) => <span key={`f${i}`}>★</span>)}
        {hasHalf && <span>★</span>}
        {Array(emptyStars).fill(0).map((_, i) => <span key={`e${i}`} className="opacity-25">★</span>)}
      </div>
      <span className="text-[10px] text-on-surface-variant/60 font-semibold">{rating.toFixed(1)}/5</span>
    </div>
  );
};

const ChatDetailPanel: React.FC = () => {
  const { user } = useAuth();
  const { 
    activeChat, activeChatId, inputText, setInputText, 
    setIsRightPanelOpen, createNewChat, sendMessage, isGuest 
  } = useChat();

  // Profile fields from DB — show "—" if missing
  const profileFields: [string, string][] = [
    ['Name', user?.name || '—'],
    ['Date of Birth', user?.dob || '—'],
    ['Time of Birth', user?.tob || '—'],
    ['Place of Birth', user?.pob || '—'],
    ['Moon Sign', user?.moonSign || '—'],
    ['Sun Sign', user?.sunSign || '—'],
  ];

  const handleTopicClick = async (topicLabel: string) => {
    if (isGuest) return; // Prevent guest from using topic pills for new chats
    // Set the input text
    setInputText(topicLabel);
    
    // If no active chat, create a new one with this topic as the first message
    if (!activeChatId || activeChatId.startsWith('temp-')) {
      await createNewChat(topicLabel);
    }
  };

  return (
    <>
      {/* My Birth Chart Panel — Data from DB */}
      <div className="mb-1 relative">
        {isGuest && (
          <div className="absolute inset-0 z-50 backdrop-blur-[2px] bg-surface/40 flex flex-col items-center justify-center p-4 text-center rounded-xl">
             <Lock className="w-8 h-8 text-secondary/40 mb-2" />
             <p className="text-[10px] font-bold text-primary">Identity Required</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <SidebarSectionLabel variant="gold">MY BIRTH CHART</SidebarSectionLabel>
          <button 
            onClick={() => setIsRightPanelOpen(false)}
            className="xl:hidden p-1.5 text-on-surface-variant/50 hover:text-on-surface transition-colors -mt-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Card variant="bordered" padding="sm" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-on-surface">
              {user?.name || user?.email || '—'}
            </p>
            <span className="text-[10px] text-secondary cursor-pointer hover:underline">Edit</span>
          </div>
          {profileFields.map(([label, value]) => (
            <div key={label} className="flex justify-between py-0.5 border-b border-outline-variant/10 last:border-b-0">
              <span className="text-[10px] text-on-surface-variant/60">{label}</span>
              <span className={`text-[10px] font-semibold ${value === '—' ? 'text-on-surface-variant/25' : 'text-on-surface-variant'}`}>
                {value}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Chat Rating Summary */}
      {activeChat && (
        <div className="mb-1">
          <SidebarSectionLabel variant="gold">CHAT RATING</SidebarSectionLabel>
          <Card variant="bordered" padding="sm" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3">
            {activeChat.averageRating != null ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <ChatRatingDisplay rating={activeChat.averageRating} />
                <p className="text-[10px] text-on-surface-variant/40">
                  Average across {activeChat.messages.filter(m => m.type === 'ai' && m.rating != null).length} rated responses
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-on-surface-variant/30 text-center py-2">
                Rate AI responses to see average here
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Topic Pills */}
      <div className="shrink-0 pt-1 border-t border-outline-variant/10">
        <div className="px-0 pt-2">
          <SidebarSectionLabel>ASK ABOUT</SidebarSectionLabel>
          <div className="grid grid-cols-2 gap-1 gap-x-2">
            {topicPills.map((topic) => (
              <TopicPill
                key={topic.label}
                icon={topic.icon}
                label={topic.label}
                active={inputText === topic.label}
                onClick={() => handleTopicClick(topic.label)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatDetailPanel;
