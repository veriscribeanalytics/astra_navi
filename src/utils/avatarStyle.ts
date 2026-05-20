import { Briefcase, Heart, Sparkles, Star } from 'lucide-react';
import type React from 'react';

const AVATAR_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  navi: Sparkles,
  career_mentor: Briefcase,
  relationship_guide: Heart,
  spiritual_guide: Star,
  astro_sage: Sparkles,
};

const AVATAR_ACCENT_MAP: Record<string, string> = {
  navi: 'text-secondary bg-secondary/10 border-secondary/30',
  career_mentor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  relationship_guide: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  spiritual_guide: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  astro_sage: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

// Maps avatarId -> image filename. Files are named after each avatar's display name,
// not its id (career_mentor's name is Arya, spiritual_guide's name is Anand, etc.).
const AVATAR_IMAGE_MAP: Record<string, string> = {
  navi: '/images/avatars/NAVI_AVATAR.jpeg',
  career_mentor: '/images/avatars/ARYA_AVATAR.jpeg',
  relationship_guide: '/images/avatars/MEERA_AVATAR.jpeg',
  spiritual_guide: '/images/avatars/ANAND_AVATAR.jpeg',
  astro_sage: '/images/avatars/RISHI_AVATAR.jpeg',
};

export const getAvatarIcon = (avatarId?: string) =>
  AVATAR_ICON_MAP[avatarId ?? 'navi'] || Sparkles;

export const getAvatarAccent = (avatarId?: string) =>
  AVATAR_ACCENT_MAP[avatarId ?? 'navi'] || AVATAR_ACCENT_MAP.navi;

/** Returns the image src for an avatar, or null if none configured. */
export const getAvatarImage = (avatarId?: string): string | null =>
  AVATAR_IMAGE_MAP[avatarId ?? 'navi'] ?? null;

export type AvatarTheme = {
  secondary: string;
  glowColor: string;
  flareGold: string;
};

const AVATAR_THEME_MAP: Record<string, AvatarTheme> = {
  navi:                { secondary: '#06b6d4', glowColor: 'rgba(6,182,212,0.35)',   flareGold: '#67e8f9' },
  career_mentor:       { secondary: '#3b82f6', glowColor: 'rgba(59,130,246,0.35)',  flareGold: '#93c5fd' },
  relationship_guide:  { secondary: '#f43f5e', glowColor: 'rgba(244,63,94,0.35)',   flareGold: '#fda4af' },
  spiritual_guide:     { secondary: '#8b5cf6', glowColor: 'rgba(139,92,246,0.35)',  flareGold: '#c4b5fd' },
  astro_sage:          { secondary: '#d97706', glowColor: 'rgba(217,119,6,0.35)',   flareGold: '#fcd34d' },
};

export const getAvatarTheme = (avatarId?: string): AvatarTheme =>
  AVATAR_THEME_MAP[avatarId ?? 'navi'] ?? AVATAR_THEME_MAP.navi;
