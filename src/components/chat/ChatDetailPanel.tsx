'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SidebarSectionLabel from '@/components/ui/SidebarSectionLabel';
import TopicPill from '@/components/ui/TopicPill';

const luckyGrid = [
  { label: 'Lucky colour', value: 'Blue', color: '#3b82f6' },
  { label: 'Lucky number', value: '8', color: undefined },
  { label: 'Energy', value: 'Positive', color: '#22c55e' },
  { label: 'Moon in', value: 'U. Bhadra', color: undefined },
  { label: 'Rahu Kaal', value: '06:14–07:48', color: '#ef4444' },
  { label: 'Shubh time', value: '09:30–11:00', color: '#22c55e' },
];

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

const ChatDetailPanel: React.FC = () => {
  return (
    <aside className="chat-right-sidebar display-flex">
      {/* My Birth Chart Mini Card */}
      <div className="mb-5">
        <SidebarSectionLabel variant="gold">MY BIRTH CHART</SidebarSectionLabel>
        <Card variant="bordered" padding="sm" hoverable={false} className="!rounded-xl !border-outline-variant/20 !p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-on-surface">Priya Sharma</p>
            <span className="text-[10px] text-secondary cursor-pointer hover:underline">Edit</span>
          </div>
          {[
            ['Lagna', 'Vrishchika ♏'],
            ['Moon sign', 'Mesha ♈'],
            ['Sun sign', 'Kanya ♍'],
            ['Nakshatra', 'Ashwini'],
            ['Dasha', 'Saturn · 2024–43'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-0.5 border-b border-outline-variant/10 last:border-b-0">
              <span className="text-[10px] text-on-surface-variant/60">{label}</span>
              <span className="text-[10px] text-on-surface-variant font-semibold">{value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Today For You */}
      <div className="mb-5">
        <SidebarSectionLabel variant="gold">TODAY FOR YOU</SidebarSectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {luckyGrid.map((item) => (
            <Card key={item.label} variant="bordered" padding="sm" className="!bg-surface/40 !rounded-lg !px-2.5 !py-2 !border-outline-variant/5" hoverable={false}>
              <p className="text-[9px] text-on-surface-variant/40 mb-0.5">{item.label}</p>
              <p
                className="text-xs font-bold text-on-surface-variant"
                style={item.color ? { color: item.color } : undefined}
              >
                {item.value}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Fixed Footer Content Wrapper */}
      <div className="shrink-0 pb-4 pt-2 border-t border-outline-variant/10">
        {/* Topic Pills */}
        <div className="px-3.5 pt-2">
          <SidebarSectionLabel>ASK ABOUT</SidebarSectionLabel>
          <div className="grid grid-cols-2 gap-1 gap-x-2">
            {topicPills.map((topic) => (
              <TopicPill 
                key={topic.label}
                icon={topic.icon}
                label={topic.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Compatibility Teaser */}
      <Card variant="bordered" padding="sm" hoverable={false} className="!rounded-xl !border-secondary/12 !bg-secondary/5 !p-2.5">
        <p className="text-[11px] text-on-surface-variant/60 mb-2 leading-relaxed">
          Check your Kundli compatibility with a partner — 36-gun Milan + Dosha analysis
        </p>
        <Button size="sm" fullWidth className="!text-[10px] !py-1.5">
          Check Kundli Match ✦
        </Button>
      </Card>
    </aside>
  );
};

export default ChatDetailPanel;
