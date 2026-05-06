'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LanguagePicker: React.FC = () => {
  const { language, setLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = availableLanguages.find(l => l.code === language) || availableLanguages[0];

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary/5 transition-all text-[11px] font-bold text-primary/70 hover:text-secondary uppercase tracking-widest border border-outline-variant/10"
      >
        <Globe className="w-3.5 h-3.5" />
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
            className="absolute top-full right-0 mt-2 w-48 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden z-[300]"
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
                    <span className="text-[13px]">{lang.nativeName}</span>
                    <span className="text-[10px] opacity-50 font-normal">{lang.name}</span>
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
