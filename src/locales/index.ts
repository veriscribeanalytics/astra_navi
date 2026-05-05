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
