'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/** Tiny inline SVG flags — guaranteed to render on all platforms including Windows. */
const CountryFlag: React.FC<{ code: string; className?: string }> = ({ code, className }) => {
  const size = 20;
  const h = 14;

  const flags: Record<string, React.ReactNode> = {
    // 🇬🇧 United Kingdom — simplified Union Jack for tiny size
    UK: (
      <svg viewBox={`0 0 ${size} ${h}`} width={size} height={h} className={className} aria-label="UK">
        <rect width={size} height={h} fill="#012169" rx="1" />
        <line x1="0" y1="0" x2={size} y2={h} stroke="#fff" strokeWidth="3" />
        <line x1={size} y1="0" x2="0" y2={h} stroke="#fff" strokeWidth="3" />
        <line x1={size / 2} y1="0" x2={size / 2} y2={h} stroke="#fff" strokeWidth="4" />
        <line x1="0" y1={h / 2} x2={size} y2={h / 2} stroke="#fff" strokeWidth="4" />
        <line x1="0" y1="0" x2={size} y2={h} stroke="#C8102E" strokeWidth="1.5" />
        <line x1={size} y1="0" x2="0" y2={h} stroke="#C8102E" strokeWidth="1.5" />
        <line x1={size / 2} y1="0" x2={size / 2} y2={h} stroke="#C8102E" strokeWidth="2" />
        <line x1="0" y1={h / 2} x2={size} y2={h / 2} stroke="#C8102E" strokeWidth="2" />
      </svg>
    ),

    // 🇮🇳 India — tricolor with Ashoka Chakra
    IN: (
      <svg viewBox={`0 0 ${size} ${h}`} width={size} height={h} className={className} aria-label="India">
        <rect y="0" width={size} height={h / 3} fill="#FF9933" rx="0" />
        <rect y={h / 3} width={size} height={h / 3} fill="#FFFFFF" />
        <rect y={2 * h / 3} width={size} height={h / 3} fill="#138808" />
        <circle cx={size / 2} cy={h / 2} r={2.5} fill="#000080" />
      </svg>
    ),

    // South Korea - Taegeukgi with taegeuk and four trigrams.
    KR: (
      <svg viewBox="0 0 72 48" width="21" height={h} className={className} aria-label="South Korea">
        <rect width="72" height="48" fill="#FFFFFF" rx="2" />

        <g transform="translate(36 24) rotate(18)">
          <circle r="12" fill="#CD2E3A" />
          <path
            fill="#0047A0"
            d="M-12 0C-12 6.627-6.627 12 0 12C6.627 12 12 6.627 12 0C12-3.314 9.314-6 6-6C2.686-6 0-3.314 0 0C0 3.314-2.686 6-6 6C-9.314 6-12 3.314-12 0Z"
          />
        </g>

        <g fill="#000000">
          <g transform="translate(18 12) rotate(-33.6900675)">
            <rect x="-7" y="-4" width="14" height="2" />
            <rect x="-7" y="-1" width="14" height="2" />
            <rect x="-7" y="2" width="14" height="2" />
          </g>

          <g transform="translate(54 12) rotate(33.6900675)">
            <rect x="-7" y="-4" width="5.5" height="2" />
            <rect x="1.5" y="-4" width="5.5" height="2" />
            <rect x="-7" y="-1" width="14" height="2" />
            <rect x="-7" y="2" width="5.5" height="2" />
            <rect x="1.5" y="2" width="5.5" height="2" />
          </g>

          <g transform="translate(18 36) rotate(33.6900675)">
            <rect x="-7" y="-4" width="14" height="2" />
            <rect x="-7" y="-1" width="5.5" height="2" />
            <rect x="1.5" y="-1" width="5.5" height="2" />
            <rect x="-7" y="2" width="14" height="2" />
          </g>

          <g transform="translate(54 36) rotate(-33.6900675)">
            <rect x="-7" y="-4" width="5.5" height="2" />
            <rect x="1.5" y="-4" width="5.5" height="2" />
            <rect x="-7" y="-1" width="5.5" height="2" />
            <rect x="1.5" y="-1" width="5.5" height="2" />
            <rect x="-7" y="2" width="5.5" height="2" />
            <rect x="1.5" y="2" width="5.5" height="2" />
          </g>
        </g>
      </svg>
    ),
  };

  return <>{flags[code] || <span className={className}>{code}</span>}</>;
};

interface LanguagePickerProps {
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  align = 'right',
}) => {
  const { language, setLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  const getCountryCode = (code: string): string => {
    const map: Record<string, string> = {
      en: 'UK', hi: 'IN', ta: 'IN', te: 'IN', kn: 'IN', bn: 'IN',
      mr: 'IN', gu: 'IN', ml: 'IN', pa: 'IN', ko: 'KR',
    };
    return map[code] || code.toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary/5 transition-all text-[11px] font-bold text-primary/70 hover:text-secondary uppercase tracking-widest border border-outline-variant/10 ${buttonClassName}`}
      >
        <CountryFlag code={getCountryCode(currentLanguage.code)} className="shrink-0 rounded-[2px] overflow-hidden opacity-90" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-48 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden z-[300] ${dropdownClassName}`}
          >
            <div className="p-1.5 max-h-[320px] overflow-y-auto scrollbar-hide">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                    language === lang.code
                      ? 'bg-secondary/10 text-secondary font-bold'
                      : 'text-primary/70 hover:bg-secondary/5 hover:text-primary'
                  }`}
                >
                  <span className="flex flex-col items-start">
                    <span className="text-[13px] flex items-center gap-2">
                      <CountryFlag code={getCountryCode(lang.code)} className="shrink-0 rounded-[1px] overflow-hidden opacity-80" />
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] opacity-50 font-normal ml-6">{lang.name}</span>
                  </span>
                  {language === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguagePicker;
