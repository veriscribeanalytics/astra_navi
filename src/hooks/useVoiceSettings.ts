'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from './useTranslation';
import { LOCALE_BY_LANGUAGE, LANGUAGE_CODE_TO_NAME } from '@/locales';

const VOICE_STORAGE_KEY = 'astranavi_tts_voice';

let cachedVoicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) {
    return Promise.resolve([]);
  }
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length) return Promise.resolve(immediate);
  if (!cachedVoicesPromise) {
    cachedVoicesPromise = new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        const voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', finish);
        cachedVoicesPromise = null;
        resolve(voices);
      };
      window.speechSynthesis.addEventListener('voiceschanged', finish);
      setTimeout(finish, 1000);
      const retry = window.speechSynthesis.getVoices();
      if (retry.length) finish();
    });
  }
  return cachedVoicesPromise;
}

export function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  const prefix = langCode.toLowerCase().split('-')[0];
  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (!sameLang.length) return null;
  const exact = sameLang.find((v) => v.lang.toLowerCase() === langCode.toLowerCase());
  const preferred = sameLang.find((v) => /google|natural|premium|microsoft/i.test(v.name));
  return preferred || exact || sameLang[0];
}

const SAMPLE_TEXT: Record<string, string> = {
  en: 'Hello, this is Navi. I can read your messages aloud.',
  hi: 'नमस्ते, मैं नवी हूँ। मैं आपके संदेश पढ़कर सुना सकती हूँ।',
  ta: 'வணக்கம், நான் நவி. நான் உங்கள் செய்திகளை வாசித்துக் காட்ட முடியும்.',
  te: 'నమస్తే, నేను నవి. నేను మీ సందేశాలను చదివి వినిపించగలను.',
  kn: 'ನಮಸ್ಕಾರ, ನಾನು ನವಿ. ನಾನು ನಿಮ್ಮ ಸಂದೇಶಗಳನ್ನು ಓದಿ ಹೇಳಬಲ್ಲೆ.',
  bn: 'নমস্কার, আমি নবী। আমি আপনার বার্তাগুলো পড়ে শোনাতে পারি।',
  mr: 'नमस्कार, मी नवी आहे. मी तुमचे संदेश वाचून दाखवू शकतो.',
  gu: 'નમસ્તે, હું નવી છું. હું તમારા સંદેશો વાંચીને સંભળાવી શકું છું.',
  ml: 'നമസ്കാരം, ഞാൻ നവി ആണ്. ഞാൻ നിങ്ങളുടെ സന്ദേശങ്ങൾ വായിച്ചു കേൾപ്പിക്കാം.',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਨਵੀ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੇ ਸੁਨੇਹੇ ਪੜ੍ਹ ਕੇ ਸੁਣਾ ਸਕਦੀ ਹਾਂ।',
  ko: '안녕하세요, 저는 나비입니다. 메시지를 읽어드릴 수 있어요.',
};

export interface VoiceSettings {
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  voicesForLang: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string | null) => void;
  resolveVoice: () => SpeechSynthesisVoice | null;
  previewVoice: (voiceURI: string | null) => void;
  stopPreview: () => void;
  isPreviewing: boolean;
  langCode: string;
  langName: string;
}

export function useVoiceSettings(): VoiceSettings {
  const { language } = useTranslation();
  const langCode = LOCALE_BY_LANGUAGE[language] || 'en-IN';
  const langName = LANGUAGE_CODE_TO_NAME[language] || 'English';
  const prefix = langCode.toLowerCase().split('-')[0];

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewingRef = useRef(false);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    let active = true;
    loadSpeechVoices().then((v) => {
      if (active) setVoices(v);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(VOICE_STORAGE_KEY);
    setSelectedVoiceURIState(stored || null);
  }, []);

  const setSelectedVoiceURI = useCallback((uri: string | null) => {
    setSelectedVoiceURIState(uri);
    if (typeof window === 'undefined') return;
    if (uri) {
      localStorage.setItem(VOICE_STORAGE_KEY, uri);
    } else {
      localStorage.removeItem(VOICE_STORAGE_KEY);
    }
  }, []);

  const voicesForLang = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));

  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (selectedVoiceURI) {
      const explicit = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (explicit) return explicit;
    }
    return pickVoiceForLang(voices, langCode);
  }, [voices, selectedVoiceURI, langCode]);

  const stopPreview = useCallback(() => {
    if (!isSpeechSupported()) return;
    previewingRef.current = false;
    setIsPreviewing(false);
    window.speechSynthesis.cancel();
  }, [setIsPreviewing]);

  const previewVoice = useCallback(
    (voiceURI: string | null) => {
      if (!isSpeechSupported()) return;
      window.speechSynthesis.cancel();
      const voice =
        (voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : null) ||
        pickVoiceForLang(voices, langCode);
      const text = SAMPLE_TEXT[prefix] || SAMPLE_TEXT.en;
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = langCode;
      }
      utterance.rate = 0.95;
      utterance.onend = () => {
        if (previewingRef.current) {
          previewingRef.current = false;
          setIsPreviewing(false);
        }
      };
      utterance.onerror = () => {
        previewingRef.current = false;
        setIsPreviewing(false);
      };
      previewingRef.current = true;
      setIsPreviewing(true);
      window.speechSynthesis.speak(utterance);
    },
    [voices, langCode, prefix, setIsPreviewing]
  );

  return {
    isSupported: isSpeechSupported(),
    voices,
    voicesForLang,
    selectedVoiceURI,
    setSelectedVoiceURI,
    resolveVoice,
    previewVoice,
    stopPreview,
    isPreviewing,
    langCode,
    langName,
  };
}
