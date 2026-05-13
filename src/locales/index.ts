import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';
import kn from './kn.json';
import bn from './bn.json';
import mr from './mr.json';
import gu from './gu.json';
import ml from './ml.json';
import pa from './pa.json';

export const locales = {
  en,
  hi,
  ta,
  te,
  kn,
  bn,
  mr,
  gu,
  ml,
  pa,
};

export type LocaleType = typeof en;
export type LanguageCode = keyof typeof locales;

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

export const defaultLanguage = 'en' as const;

/**
 * Map short ISO 639-1 language codes to full English names.
 * Used by API proxy routes to convert frontend language codes
 * to the format the FastAPI backend expects (e.g. "hi" → "Hindi").
 */
export const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  ml: 'Malayalam',
  pa: 'Punjabi',
};

/**
 * Convert a language code to its full English name for backend API calls.
 * Falls back to "English" for unknown codes.
 */
export function languageCodeToName(code: string | null | undefined): string {
  if (!code) return 'English';
  return LANGUAGE_CODE_TO_NAME[code] || 'English';
}
