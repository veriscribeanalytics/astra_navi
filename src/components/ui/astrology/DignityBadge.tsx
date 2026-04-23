import React from 'react';

export type DignityType = 'Exalted' | 'Debilitated' | 'Moolatrikona' | 'Own House' | 'Great Friend' | 'Friend' | 'Neutral' | 'Enemy' | 'Great Enemy' | 'Normal';

interface DignityBadgeProps {
  dignity: DignityType | string;
  short?: boolean;
}

const DignityBadge: React.FC<DignityBadgeProps> = ({ dignity, short = false }) => {
  if (!dignity || dignity === 'Normal') return null;

  const getStyle = () => {
    switch (dignity) {
      case 'Exalted':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          border: 'border-emerald-500/20',
          icon: '⬆',
          label: 'EX'
        };
      case 'Debilitated':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-500',
          border: 'border-red-500/20',
          icon: '⬇',
          label: 'DB'
        };
      case 'Moolatrikona':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-500',
          border: 'border-amber-500/20',
          icon: '⭐',
          label: 'MT'
        };
      case 'Own House':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-500',
          border: 'border-blue-500/20',
          icon: '🏠',
          label: 'OWN'
        };
      default:
        return {
          bg: 'bg-foreground/5',
          text: 'text-foreground/40',
          border: 'border-foreground/10',
          icon: '',
          label: dignity.substring(0, 2).toUpperCase()
        };
    }
  };

  const style = getStyle();

  return (
    <span className={`
      inline-flex items-center gap-1 font-bold rounded-full border
      ${style.bg} ${style.text} ${style.border}
      ${short ? 'px-1 py-0 text-[7px]' : 'px-2 py-0.5 text-[9px] uppercase tracking-wider'}
    `}>
      {short ? style.icon || style.label : (
        <>
          {style.icon && <span className="text-[10px]">{style.icon}</span>}
          {dignity}
        </>
      )}
    </span>
  );
};

export default DignityBadge;
