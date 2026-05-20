import { useEffect, useRef } from 'react';
import { getAvatarTheme } from '@/utils/avatarStyle';

// Per-avatar tinted backgrounds (light / dark)
const AVATAR_BG_LIGHT: Record<string, { bg: string; surface: string; outline: string }> = {
  navi:               { bg: '#f0fafa', surface: '#d0f4f8', outline: '#67e8f9' },
  career_mentor:      { bg: '#f0f4ff', surface: '#ddeaff', outline: '#93c5fd' },
  relationship_guide: { bg: '#fff0f3', surface: '#ffdde4', outline: '#fda4af' },
  spiritual_guide:    { bg: '#f5f0ff', surface: '#ecdeff', outline: '#c4b5fd' },
  astro_sage:         { bg: '#fff8ed', surface: '#ffecd0', outline: '#fcd34d' },
};

const AVATAR_BG_DARK: Record<string, { bg: string; surface: string; outline: string }> = {
  navi:               { bg: '#030f14', surface: '#051820', outline: '#06b6d4' },
  career_mentor:      { bg: '#080d1e', surface: '#0a1228', outline: '#3b82f6' },
  relationship_guide: { bg: '#180810', surface: '#220a14', outline: '#f43f5e' },
  spiritual_guide:    { bg: '#0e0818', surface: '#160a22', outline: '#8b5cf6' },
  astro_sage:         { bg: '#120a04', surface: '#1c1008', outline: '#d97706' },
};

export function useAvatarTheme(avatarId?: string) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    const id = avatarId ?? 'navi';
    const theme = getAvatarTheme(id);
    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark ? AVATAR_BG_DARK[id] : AVATAR_BG_LIGHT[id];
    const root = document.documentElement;

    // Smooth transition for the color shift
    root.style.setProperty('transition', 'background-color 0.6s ease, color 0.3s ease');

    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--glow-color', theme.glowColor);
    root.style.setProperty('--flare-gold', theme.flareGold);
    if (bg) {
      root.style.setProperty('--background', bg.bg);
      root.style.setProperty('--surface', bg.surface);
      root.style.setProperty('--outline-variant', bg.outline);
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      root.classList.add('avatar-theme-pulse');
      timer = setTimeout(() => {
        root.classList.remove('avatar-theme-pulse');
      }, 400);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      root.classList.remove('avatar-theme-pulse');
      root.style.removeProperty('transition');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--glow-color');
      root.style.removeProperty('--flare-gold');
      root.style.removeProperty('--background');
      root.style.removeProperty('--surface');
      root.style.removeProperty('--outline-variant');
    };
  }, [avatarId]);
}
