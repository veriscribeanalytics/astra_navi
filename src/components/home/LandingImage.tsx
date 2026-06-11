'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Compass, CalendarDays, Bot, Users, Image as ImageIcon } from 'lucide-react';

interface LandingImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderName: string;
  aspectRatio: string; // e.g. 'aspect-[1170/2532]' or 'aspect-[2560/1440]'
  type?: 'mobile' | 'desktop';
  icon?: 'dashboard' | 'kundli' | 'forecast' | 'chat' | 'family';
}

export default function LandingImage({
  src,
  alt,
  className = '',
  placeholderName,
  aspectRatio,
  type = 'mobile',
  icon = 'dashboard',
}: LandingImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageExists, setImageExists] = useState<boolean | null>(null);

  // Check if image exists on mount/src change
  useEffect(() => {
    setHasError(false);
    if (!src) {
      setImageExists(false);
      return;
    }
    const img = new Image();
    img.src = src;
    img.onload = () => setImageExists(true);
    img.onerror = () => {
      setImageExists(false);
      setHasError(true);
    };
  }, [src]);

  const getIcon = () => {
    switch (icon) {
      case 'dashboard':
        return <LayoutDashboard className="w-8 h-8 text-secondary" />;
      case 'kundli':
        return <Compass className="w-8 h-8 text-secondary" />;
      case 'forecast':
        return <CalendarDays className="w-8 h-8 text-secondary" />;
      case 'chat':
        return <Bot className="w-8 h-8 text-secondary" />;
      case 'family':
        return <Users className="w-8 h-8 text-secondary" />;
      default:
        return <ImageIcon className="w-8 h-8 text-secondary" />;
    }
  };

  if (imageExists && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} object-cover w-full h-full`}
        loading="lazy"
      />
    );
  }

  // Beautiful wireframe fallback for missing images
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0d0922] to-[#060410] border-2 border-dashed border-secondary/25 rounded-[32px] overflow-hidden group shadow-2xl p-6 ${className} ${aspectRatio}`}
    >
      {/* Abstract background grids to look like a premium app blueprint */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(200,136,10,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#c8880a_1px,transparent_1px),linear-gradient(to_bottom,#c8880a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Placeholder Details */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-[85%]">
        <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center shadow-lg shadow-secondary/5 group-hover:scale-105 transition-transform duration-300">
          {getIcon()}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary/80 font-body">
            {type === 'mobile' ? 'Mobile Screen' : 'Desktop Screen'}
          </p>
          <h4 className="text-sm font-bold text-primary font-headline">{placeholderName}</h4>
        </div>
        <p className="text-[9px] text-on-surface-variant/50 leading-normal max-w-xs">
          Asset: <span className="font-mono text-secondary/70">{src}</span>
        </p>
      </div>

      {/* Styled mockup elements */}
      {type === 'mobile' ? (
        <div className="absolute bottom-6 left-6 right-6 h-1/3 border border-outline-variant/15 rounded-2xl bg-surface-variant/5 p-3 space-y-2 pointer-events-none opacity-30">
          <div className="h-2 w-1/2 bg-secondary/20 rounded-full" />
          <div className="h-1.5 w-3/4 bg-primary/25 rounded-full" />
          <div className="h-1.5 w-full bg-primary/15 rounded-full" />
          <div className="grid grid-cols-3 gap-1.5 pt-2">
            <div className="h-8 bg-secondary/10 border border-secondary/15 rounded-lg" />
            <div className="h-8 bg-primary/5 border border-outline-variant/15 rounded-lg" />
            <div className="h-8 bg-primary/5 border border-outline-variant/15 rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 right-6 h-1/4 border border-outline-variant/15 rounded-2xl bg-surface-variant/5 p-3 flex items-center justify-between gap-4 pointer-events-none opacity-30">
          <div className="space-y-2 flex-grow">
            <div className="h-2.5 w-1/3 bg-secondary/20 rounded-full" />
            <div className="h-1.5 w-2/3 bg-primary/25 rounded-full" />
          </div>
          <div className="w-1/4 h-10 bg-secondary/10 border border-secondary/20 rounded-lg shrink-0" />
        </div>
      )}
    </div>
  );
}
