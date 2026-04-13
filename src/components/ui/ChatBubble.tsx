'use client';

import React from 'react';

interface ChatBubbleProps {
  type: 'ai' | 'user';
  children: React.ReactNode;
  label?: string; // e.g. "NAVI · AI ASTROLOGER"
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  type, 
  children, 
  label, 
  avatar,
  actions 
}) => {
  const isAi = type === 'ai';

  return (
    <div className={`flex gap-2.5 items-start ${isAi ? 'max-w-[85%]' : 'justify-end w-full'}`}>
      {isAi && (
        <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-secondary text-sm shrink-0 mt-0.5">
          {avatar || '✦'}
        </div>
      )}
      
      <div className={`${isAi ? 'flex-1 min-w-0' : 'max-w-[75%]'}`}>
        <div className={isAi ? 'chat-ai-bubble' : 'chat-user-bubble'}>
          {isAi && label && (
            <p className="text-[10px] text-secondary font-bold tracking-wider mb-1.5 uppercase">
              {label}
            </p>
          )}
          <div 
            className="text-[12px] sm:text-[13px] leading-relaxed break-words" 
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          >
            {children}
          </div>
        </div>

        {actions && (
          <div className={`flex gap-1.5 mt-1.5 ${!isAi ? 'justify-end' : ''}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
