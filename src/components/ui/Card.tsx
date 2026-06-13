import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  allowOverflow?: boolean;
  colorScheme?: 'default' | 'ivory' | 'lavender' | 'midnight' | 'galaxy';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  variant = 'default',
  padding = 'md',
  hoverable = true,
  allowOverflow = false,
  colorScheme = 'default',
}) => {
  const baseStyles = `transition-all duration-300 rounded-[28px] ${allowOverflow ? '' : 'overflow-hidden'}`;

  // 3D depth: top-left bright edge (light source from top-left) + bottom-right dark edge + layered drop shadow
  const shadowBase =
    'shadow-[0_2px_0_0_rgba(255,255,255,0.06)_inset,0_-1px_0_0_rgba(0,0,0,0.35)_inset,0_8px_32px_0_rgba(0,0,0,0.45),0_2px_8px_0_rgba(0,0,0,0.3)]';
  const shadowElevated =
    'shadow-[0_2px_0_0_rgba(255,255,255,0.09)_inset,0_-1px_0_0_rgba(0,0,0,0.45)_inset,0_16px_48px_0_rgba(0,0,0,0.55),0_4px_16px_0_rgba(0,0,0,0.4)]';
  const shadowHover =
    'hover:shadow-[0_2px_0_0_rgba(255,255,255,0.12)_inset,0_-1px_0_0_rgba(0,0,0,0.5)_inset,0_24px_64px_0_rgba(0,0,0,0.6),0_6px_24px_0_rgba(0,0,0,0.45)] hover:-translate-y-[2px]';

  const colorSchemes = {
    default: {
      default: `bg-surface border border-white/[0.08] border-b-black/40 border-r-black/30`,
      elevated: `bg-surface-variant border border-white/[0.10] border-b-black/50 border-r-black/35`,
      bordered: `bg-surface border-[1.5px] border-white/[0.12] border-b-black/40 border-r-black/30`,
    },
    ivory: {
      default: `bg-[rgb(22,20,30)] border border-white/[0.08] border-b-black/40 border-r-black/30`,
      elevated: `bg-[rgb(25,22,33)] border border-white/[0.10] border-b-black/48 border-r-black/32`,
      bordered: `bg-[rgb(22,20,30)] border-[1.5px] border-white/[0.12] border-b-black/40 border-r-black/30`,
    },
    lavender: {
      default: `bg-[rgb(21,19,30)] border border-purple-300/10 border-b-black/40 border-r-black/30`,
      elevated: `bg-[rgb(24,21,35)] border border-purple-300/12 border-b-black/50 border-r-black/35`,
      bordered: `bg-[rgb(21,19,30)] border-[1.5px] border-purple-300/15 border-b-black/40 border-r-black/30`,
    },
    midnight: {
      default: `bg-[rgb(14,14,22)] border border-white/[0.07] border-b-black/50 border-r-black/40`,
      elevated: `bg-[rgb(17,17,26)] border border-white/[0.09] border-b-black/55 border-r-black/45`,
      bordered: `bg-[rgb(14,14,22)] border-[1.5px] border-white/[0.10] border-b-black/50 border-r-black/40`,
    },
    galaxy: {
      default: `bg-[rgb(16,15,26)] border border-violet-400/10 border-b-black/45 border-r-black/35`,
      elevated: `bg-[rgb(19,17,30)] border border-violet-400/14 border-b-black/52 border-r-black/40`,
      bordered: `bg-[rgb(16,15,26)] border-[1.5px] border-violet-400/16 border-b-black/45 border-r-black/35`,
    },
  };

  const variants = {
    default: `${colorSchemes[colorScheme].default} ${shadowBase}`,
    elevated: `${colorSchemes[colorScheme].elevated} ${shadowElevated}`,
    bordered: `${colorSchemes[colorScheme].bordered} ${shadowBase}`,
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 md:p-6 lg:p-8',
    lg: 'p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12',
    xl: 'p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16',
  };

  const hoverStyles = hoverable
    ? `${shadowHover} cursor-pointer`
    : '';

  const combinedClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverStyles}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={combinedClasses} style={style}>
      {children}
    </div>
  );
};

export default Card;
