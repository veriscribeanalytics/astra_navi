'use client';

import React from 'react';

interface TopicPillProps {
  icon: string | React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

const TopicPill: React.FC<TopicPillProps> = ({ 
  icon, 
  label, 
  onClick, 
  active = false 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] 
        border transition-all duration-200 bg-surface/30
        ${active 
          ? 'text-secondary border-secondary/25 bg-secondary/8 shadow-sm shadow-secondary/5' 
          : 'text-on-surface-variant/70 border-outline-variant/10 hover:bg-surface-variant/40 hover:border-outline-variant/30 hover:text-on-surface-variant'
        }
      `}
    >
      <span className="text-xs w-4 text-center shrink-0">{icon}</span>
      <span className="truncate font-medium">{label}</span>
    </div>
  );
};

export default TopicPill;
