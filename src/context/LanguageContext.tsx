'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locales, LanguageCode, languages, defaultLanguage } from '@/locales';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  availableLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return defaultLanguage;
    const saved = localStorage.getItem('language') as LanguageCode;
    return saved && locales[saved] ? saved : defaultLanguage;
  });

  const setLanguage = useCallback((code: LanguageCode) => {
    if (locales[code]) {
      setLanguageState(code);
      localStorage.setItem('language', code);
      document.documentElement.lang = code;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let current = locales[language] as Record<string, unknown>;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to English if key missing in current language
        let fallback = locales[defaultLanguage] as Record<string, unknown>;
        for (const fk of keys) {
            if (fallback[fk] === undefined) return key;
            fallback = fallback[fk] as Record<string, unknown>;
        }
        return typeof fallback === 'string' ? fallback : key;
      }
      current = current[k] as Record<string, unknown>;
    }
    
    return typeof current === 'string' ? current : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
