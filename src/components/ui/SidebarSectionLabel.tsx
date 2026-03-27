'use client';

import React from 'react';

interface SidebarSectionLabelProps {
  children: React.ReactNode;
  variant?: 'gold' | 'default';
  className?: string;
}

const SidebarSectionLabel: React.FC<SidebarSectionLabelProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const baseClass = variant === 'gold' ? 'chat-section-label-gold' : 'chat-section-label';
  
  return (
    <p className={`${baseClass} ${className}`}>
      {children}
    </p>
  );
};

export default SidebarSectionLabel;
