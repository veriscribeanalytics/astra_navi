'use client';

import { useTranslation } from '@/context/LanguageContext';
import { useEffect } from 'react';
import { NOTO_FONTS_MAP } from '@/lib/fonts';

// This component manages dynamic font class application to <html> based on language
export default function FontLoader() {
  const { language } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    
    // Remove all non-latin font variable classes first
    Object.values(NOTO_FONTS_MAP).forEach(cls => {
      html.classList.remove(cls);
    });

    // Add the one for current language if it exists
    const targetClass = NOTO_FONTS_MAP[language];
    if (targetClass) {
      html.classList.add(targetClass);
    }
  }, [language]);

  return null;
}
