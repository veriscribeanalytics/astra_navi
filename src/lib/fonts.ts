import { Playfair_Display, DM_Sans, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Telugu, Noto_Sans_Kannada, Noto_Sans_Bengali, Noto_Sans_Gujarati, Noto_Sans_Malayalam, Noto_Sans_Gurmukhi } from "next/font/google";

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: 'swap',
});

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
});

export const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-noto-malayalam",
  subsets: ["malayalam"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-gurmukhi",
  subsets: ["gurmukhi"],
  weight: ["300", "400", "500", "700"],
  display: 'swap',
  preload: false,
});

export const ALL_FONT_VARIABLES = [
  playfair.variable,
  dmSans.variable,
  notoDevanagari.variable,
  notoTamil.variable,
  notoTelugu.variable,
  notoKannada.variable,
  notoBengali.variable,
  notoGujarati.variable,
  notoMalayalam.variable,
  notoGurmukhi.variable,
].join(' ');

export const NOTO_FONTS_MAP: Record<string, string> = {
  'hi': notoDevanagari.variable,
  'bn': notoBengali.variable,
  'gu': notoGujarati.variable,
  'kn': notoKannada.variable,
  'ml': notoMalayalam.variable,
  'mr': notoDevanagari.variable,
  'pa': notoGurmukhi.variable,
  'ta': notoTamil.variable,
  'te': notoTelugu.variable
};
