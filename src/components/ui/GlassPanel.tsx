import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 lg:p-8',
    lg: 'p-8 lg:p-12',
    xl: 'p-10 lg:p-16',
  };

  const hoverEffect = hoverable 
    ? 'hover:border-secondary/40 hover:-translate-y-1 transition-all duration-500' 
    : '';

  return (
    <div className={`glass-panel ${paddings[padding]} ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
};

export default GlassPanel;
