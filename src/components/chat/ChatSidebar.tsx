'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const recentChats = [
  { id: 1, title: '2026 career forecast Scorpio', date: 'Today · 2:34 PM', active: true },
  { id: 2, title: 'Saturn Sade Sati — what to do?', date: 'Yesterday', active: false },
  { id: 3, title: 'Kundli matching with Rahul', date: 'Mar 18', active: false },
  { id: 4, title: 'Best time to start business?', date: 'Mar 15', active: false },
  { id: 5, title: 'Jupiter transit effects 2026', date: 'Mar 12', active: false },
  { id: 6, title: 'Mangal Dosha in my chart', date: 'Mar 10', active: false },
  { id: 7, title: 'Financial prosperity remedies', date: 'Mar 5', active: false },
  { id: 8, title: 'Rahu transiting 5th house', date: 'Feb 28', active: false },
  { id: 9, title: 'Will I travel abroad soon?', date: 'Feb 20', active: false },
  { id: 10, title: 'Venus-Ketu conjunction impact', date: 'Feb 15', active: false },
  { id: 11, title: 'Choosing baby name by Nakshatra', date: 'Feb 10', active: false },
  { id: 12, title: 'Muhurat for buying home', date: 'Jan 28', active: false },
  { id: 13, title: 'Love life prediction 2026', date: 'Jan 20', active: false },
  { id: 14, title: 'Career change astrology guidance', date: 'Jan 15', active: false },
  { id: 15, title: 'Moon sign vs Rising sign meaning', date: 'Jan 10', active: false },
  { id: 16, title: 'Gemstones for career success', date: 'Jan 5', active: false },
  { id: 17, title: 'Marriage timing prediction', date: 'Dec 28', active: false },
  { id: 18, title: 'Navamsa chart explanation', date: 'Dec 20', active: false },
  { id: 19, title: 'Mercury retrograde effects', date: 'Dec 12', active: false },
  { id: 20, title: 'Daily horoscope insights', date: 'Dec 5', active: false },
];



import SidebarSectionLabel from '@/components/ui/SidebarSectionLabel';

const ChatSidebar: React.FC = () => {
  return (
    <aside className="chat-left-sidebar">
      {/* New Chat Button */}
      <div className="px-3.5 pt-4 pb-2 shrink-0">
        <Button variant="secondary" size="sm" fullWidth className="!border-secondary/25 !text-secondary !font-bold gap-1.5">
          <span>✦</span> New conversation
        </Button>
      </div>

      {/* Recent Chats (Scrollable Area) */}
      <div className="flex-1 min-h-0 flex flex-col pt-4">
        <div className="px-3.5 mb-1 shrink-0">
          <SidebarSectionLabel>RECENT CHATS</SidebarSectionLabel>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 pb-2 custom-scrollbar">
          <div className="flex flex-col gap-0.5">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                className={`px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 ${chat.active
                  ? 'bg-surface-variant/60 border border-outline-variant/30'
                  : 'hover:bg-surface/50'
                  }`}
              >
                <p className={`text-xs truncate mb-0.5 ${chat.active ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                  }`}>
                  {chat.title}
                </p>
                <p className="text-[10px] text-on-surface-variant/50">{chat.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
