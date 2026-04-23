import React from 'react';

interface DividerProps {
  className?: string;
  variant?: 'gradient' | 'dashed' | 'solid';
  orientation?: 'horizontal' | 'vertical';
}

const Divider: React.FC<DividerProps> = ({
  className = '',
  variant = 'gradient',
  orientation = 'horizontal',
}) => {
  const baseStyles = orientation === 'horizontal' ? 'w-full' : 'h-full';
  
  const variants = {
    gradient: orientation === 'horizontal' 
      ? 'h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent'
      : 'w-[1px] bg-gradient-to-b from-transparent via-outline-variant/30 to-transparent',
    dashed: orientation === 'horizontal'
      ? 'h-[1px] border-t border-dashed border-outline-variant/30'
      : 'w-[1px] border-l border-dashed border-outline-variant/30',
    solid: orientation === 'horizontal'
      ? 'h-[1px] bg-outline-variant/20'
      : 'w-[1px] bg-outline-variant/20',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} role="separator" />
  );
};

export default Divider;
