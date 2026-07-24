'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from './useTranslation';
import { LOCALE_BY_LANGUAGE, LANGUAGE_CODE_TO_NAME } from '@/locales';

const VOICE_STORAGE_KEY = 'astramitra_tts_voice';

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

// Unicode script ranges for every language the app speaks. Each supported
// language (except English) uses a distinct script, so the dominant script in
// a piece of text reliably identifies the spoken language regardless of the
// profile/UI language setting.
const SCRIPT_RANGES: Array<{ code: string; ranges: Array<[number, number]> }> = [
  { code: 'en', ranges: [[0x0041, 0x005a], [0x0061, 0x007a], [0x00c0, 0x024f]] }, // Latin
  { code: 'hi', ranges: [[0x0900, 0x097f]] }, // Devanagari (Hindi & Marathi)
  { code: 'bn', ranges: [[0x0980, 0x09ff]] }, // Bengali
  { code: 'pa', ranges: [[0x0a00, 0x0a7f]] }, // Gurmukhi (Punjabi)
  { code: 'gu', ranges: [[0x0a80, 0x0aff]] }, // Gujarati
  { code: 'ta', ranges: [[0x0b80, 0x0bff]] }, // Tamil
  { code: 'te', ranges: [[0x0c00, 0x0c7f]] }, // Telugu
  { code: 'kn', ranges: [[0x0c80, 0x0cff]] }, // Kannada
  { code: 'ml', ranges: [[0x0d00, 0x0d7f]] }, // Malayalam
  { code: 'ko', ranges: [[0xac00, 0xd7af], [0x1100, 0x11ff], [0x3130, 0x318f]] }, // Hangul
];

/**
 * Detect the spoken language of `text` from its Unicode script and return the
 * matching full locale code (e.g. "hi-IN"). Falls back to `fallbackLangCode`
 * (the profile/UI language) when the text carries no letter signal (only
 * digits/punctuation/whitespace).
 *
 * Devanagari is shared by Hindi and Marathi: when it is the dominant script,
 * the profile language is honored if it is Marathi, otherwise Hindi is used.
 */
export function detectLangFromText(text: string, fallbackLangCode: string): string {
  if (!text) return fallbackLangCode;
  const counts: Record<string, number> = {};
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    for (const { code: lang, ranges } of SCRIPT_RANGES) {
      for (const [start, end] of ranges) {
        if (code >= start && code <= end) {
          counts[lang] = (counts[lang] || 0) + 1;
          break;
        }
      }
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [lang, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = lang;
      bestCount = count;
    }
  }
  if (!best || bestCount === 0) return fallbackLangCode;
  if (best === 'hi') {
    const fallbackPrefix = fallbackLangCode.toLowerCase().split('-')[0];
    if (fallbackPrefix === 'mr') return 'mr-IN';
  }
  return LOCALE_BY_LANGUAGE[best] || fallbackLangCode;
}

/**
 * Resolve the locale code and best matching voice for the given text, based on
 * the text's own script rather than the profile language. The user's manually
 * selected voice is honored only when it matches the detected language; a
 * mismatched selection (e.g. a Hindi voice chosen for English text) is ignored
 * so the text is pronounced correctly.
 *
 * `explicitLang`, when provided, overrides script detection: it is the
 * backend's per-reply script hint (`"hi"` for Devanagari or Hinglish, otherwise
 * the user's resolved language). Without it, a Hinglish (Latin-script) reply
 * looks like English to script detection and gets the wrong voice — so callers
 * that have the reply's authoritative `lang` should pass it here. Absent or
 * empty (old/historical messages) → falls back to script detection as before.
 *
 * The hint is normally a short code (`"hi"`, `"en"`) mapped via
 * LOCALE_BY_LANGUAGE, but a full BCP-47 locale (`"en-IN"`) is also accepted
 * as-is — the TTS contract forecasts Hinglish possibly switching to an `en-IN`
 * voice, and tolerating a full locale here means that switch can't silently
 * fall through to the profile locale (which would pick the wrong voice).
 */
export function resolveLangAndVoiceForText(
  text: string,
  fallbackLangCode: string,
  voices: SpeechSynthesisVoice[],
  selectedVoiceURI: string | null,
  explicitLang?: string | null
): { langCode: string; voice: SpeechSynthesisVoice | null } {
  const explicitLangCode = explicitLang
    ? (() => {
        const lower = explicitLang.toLowerCase();
        return LOCALE_BY_LANGUAGE[lower] || (lower.includes('-') ? explicitLang : fallbackLangCode);
      })()
    : null;
  const detectedLangCode = explicitLangCode ?? detectLangFromText(text, fallbackLangCode);
  const prefix = detectedLangCode.toLowerCase().split('-')[0];
  if (selectedVoiceURI) {
    const explicit = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (explicit && explicit.lang.toLowerCase().startsWith(prefix)) {
      return { langCode: detectedLangCode, voice: explicit };
    }
  }
  return { langCode: detectedLangCode, voice: pickVoiceForLang(voices, detectedLangCode) };
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
