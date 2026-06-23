'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Sparkles, ArrowRight, MessageSquare,
  CheckCircle2, Star, GraduationCap,
  Heart, HeartPulse, Coins, BookOpen,
  Bot, Compass
} from 'lucide-react';
import Button from '../ui/Button';

gsap.registerPlugin(ScrollTrigger);

const ASTROLOGERS = [
  { name: 'Navi', role: 'General Vedic Guide', avatar: '/images/avatars/NAVI_AVATAR.jpeg', specialty: 'Birth chart & daily guidance', icon: Star, color: 'from-amber-500/20 to-yellow-600/20' },
  { name: 'Arya', role: 'Career Mentor', avatar: '/images/avatars/ARYA_AVATAR.jpeg', specialty: 'Dasha timings & career choices', icon: GraduationCap, color: 'from-blue-500/20 to-indigo-600/20' },
  { name: 'Meera', role: 'Relationship Guide', avatar: '/images/avatars/MEERA_AVATAR.jpeg', specialty: 'Guna matching & love transits', icon: Heart, color: 'from-rose-500/20 to-pink-600/20' },
  { name: 'Anand', role: 'Health Advisor', avatar: '/images/avatars/ANAND_AVATAR.jpeg', specialty: 'Ayurvedic balance & wellness timings', icon: HeartPulse, color: 'from-emerald-500/20 to-teal-600/20' },
  { name: 'Vidya', role: 'Financial Astrologer', avatar: '/images/avatars/VIDYA_AVATAR.jpeg', specialty: 'Wealth yogas & transit windows', icon: Coins, color: 'from-amber-600/20 to-orange-700/20' },
  { name: 'Rishi', role: 'Deep Chart Sage', avatar: '/images/avatars/RISHI_AVATAR.jpeg', specialty: 'Divisional charts & spiritual path', icon: BookOpen, color: 'from-purple-500/20 to-violet-600/20' },
];

const PHONE_RATIO = 2.02;
const BROWSER_RATIO = 2.12;

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function smoothstep(e0: number, e1: number, v: number) {
  const x = clamp((v - e0) / (e1 - e0), 0, 1);
  return x * x * (3 - 2 * x);
}

function getNavHeight() {
  if (typeof document === 'undefined') return 72;
  const v = document.documentElement.style.getPropertyValue('--navbar-height');
  if (v) return parseInt(v, 10);
  return window.innerWidth <= 1024 ? 56 : 72;
}

function isMobileLayout() { return typeof window !== 'undefined' && window.innerWidth <= 1024; }

function getPageScroller(): Window | HTMLElement {
  const htmlOverflow = window.getComputedStyle(document.documentElement).overflowY;
  const bodyOverflow = window.getComputedStyle(document.body).overflowY;
  const bodyOwnsScroll =
    (htmlOverflow === 'hidden' || htmlOverflow === 'clip') &&
    (bodyOverflow === 'auto' || bodyOverflow === 'scroll');

  return bodyOwnsScroll ? document.body : window;
}

interface Rect { x: number; y: number; w: number; h: number; r: number }

function rectLerp(a: Rect, b: Rect, t: number): Rect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t) };
}

export default function ScrollMorphSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const browserChromeRef = useRef<HTMLDivElement>(null);
  const urlTextRef = useRef<HTMLDivElement>(null);
  const mobileShotRef = useRef<HTMLDivElement>(null);
  const dashShotRef = useRef<HTMLImageElement>(null);
  const kundliShotRef = useRef<HTMLImageElement>(null);
  const forecastShotRef = useRef<HTMLImageElement>(null);
  const peekLeftRef = useRef<HTMLDivElement>(null);
  const astrologersGridRef = useRef<HTMLDivElement>(null);

  const heroTextRef = useRef<HTMLDivElement>(null);
  const dashTextRef = useRef<HTMLDivElement>(null);
  const kundliTextRef = useRef<HTMLDivElement>(null);
  const forecastTextRef = useRef<HTMLDivElement>(null);
  const astroTextRef = useRef<HTMLDivElement>(null);

  const stRef = useRef<ScrollTrigger | null>(null);
  const lastProgressRef = useRef(0);

  const getRects = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return { start: { x: 0, y: 0, w: 300, h: 606, r: 40 }, end: { x: 0, y: 0, w: 1100, h: 519, r: 16 } };
    const sw = section.clientWidth;
    const sh = section.clientHeight;
    const pad = isMobileLayout() ? 18 : 56;

    if (isMobileLayout()) {
      const startW = clamp(sw * 0.58, 216, 286);
      const startH = Math.min(sh * 0.42, startW * PHONE_RATIO);
      const startY = clamp(sh * 0.56, pad, sh - pad - startH);
      const endW = Math.min(sw - pad * 2, 720);
      const endH = Math.min(sh * 0.28, endW / BROWSER_RATIO);
      const endY = clamp(sh * 0.68, pad, sh - pad - endH);
      return {
        start: { x: (sw - startW) / 2, y: startY, w: startW, h: startH, r: 30 },
        end: { x: (sw - endW) / 2, y: endY, w: endW, h: endH, r: 14 },
      };
    }

    const textWidth = clamp(sw * 0.38, 280, 560);
    const rightAreaX = textWidth + pad;
    const rightAreaW = sw - rightAreaX - pad;

    const idealStartW = clamp(sw * 0.23, 260, 365);
    const maxStartH = sh * 0.82;
    const startH = Math.min(maxStartH, idealStartW * PHONE_RATIO);
    const startW = startH < idealStartW * PHONE_RATIO ? startH / PHONE_RATIO : idealStartW;
    const startCX = rightAreaX + rightAreaW / 2;
    const startCY = sh / 2;
    const startX = clamp(startCX - startW / 2, pad, sw - pad - startW);
    const startY = clamp(startCY - startH / 2, pad, sh - pad - startH);

    const endWMax = Math.min(rightAreaW, 1100);
    let endW = endWMax;
    let endH = endW / BROWSER_RATIO;
    const maxH = sh * 0.84;
    if (endH > maxH) { endH = maxH; endW = endH * BROWSER_RATIO; }
    const endX = rightAreaX + (rightAreaW - endW) / 2;
    const endY = (sh - endH) / 2;

    return {
      start: { x: startX, y: startY, w: startW, h: startH, r: 42 },
      end: { x: endX, y: endY, w: endW, h: endH, r: 16 },
    };
  }, []);

  const applyRect = useCallback((rect: Rect) => {
    const card = cardRef.current;
    if (!card) return;
    gsap.set(card, {
      left: rect.x, top: rect.y,
      width: rect.w, height: rect.h,
      borderRadius: rect.r,
      x: 0, y: 0, xPercent: 0, yPercent: 0,
    });
  }, []);

  const getTextLeft = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 32;
    const sw = section.clientWidth;
    if (isMobileLayout()) {
      return sw / 2;
    }
    return clamp(sw * 0.04, 32, 80);
  }, []);

  const getTextWidth = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 400;
    const sw = section.clientWidth;
    if (isMobileLayout()) return Math.min(sw * 0.88, 640);
    return clamp(sw * 0.34, 260, 520);
  }, []);

  const render = useCallback((progress: number) => {
    lastProgressRef.current = progress;
    const p = clamp(progress, 0, 1);

    const morph = smoothstep(0.12, 0.28, p);
    const heroOut = smoothstep(0.06, 0.22, p);
    const peekOut = smoothstep(0.06, 0.20, p);
    const mobileOut = smoothstep(0.16, 0.30, p);
    const chromeIn = smoothstep(0.16, 0.26, p);
    const dashShotIn = smoothstep(0.22, 0.32, p);
    const dashTextIn = smoothstep(0.20, 0.30, p);

    const dashTextOut = smoothstep(0.36, 0.46, p);
    const dashShotOut = smoothstep(0.40, 0.50, p);
    const kundliTextIn = smoothstep(0.42, 0.52, p);
    const kundliShotIn = smoothstep(0.44, 0.52, p);

    const kundliTextOut = smoothstep(0.56, 0.66, p);
    const kundliShotOut = smoothstep(0.60, 0.68, p);
    const forecastTextIn = smoothstep(0.62, 0.72, p);
    const forecastShotIn = smoothstep(0.64, 0.72, p);

    const forecastTextOut = smoothstep(0.76, 0.86, p);
    const forecastShotOut = smoothstep(0.80, 0.88, p);
    const astroTextIn = smoothstep(0.80, 0.90, p);
    const astroGridIn = smoothstep(0.82, 0.92, p);
    const browserOut = smoothstep(0.80, 0.90, p);

    const { start, end } = getRects();
    const rect = rectLerp(start, end, morph);
    applyRect(rect);

    const set = (el: Element | null, props: gsap.TweenVars) => { if (el) gsap.set(el, props); };

    set(mobileShotRef.current, { autoAlpha: 1 - mobileOut, scale: 1.015 - 0.035 * mobileOut });
    set(dashShotRef.current, { autoAlpha: dashShotIn * (1 - dashShotOut), scale: 1.03 - 0.03 * dashShotIn });
    set(kundliShotRef.current, { autoAlpha: kundliShotIn * (1 - kundliShotOut), scale: 1.03 - 0.03 * kundliShotIn });
    set(forecastShotRef.current, { autoAlpha: forecastShotIn * (1 - forecastShotOut), scale: 1.03 - 0.03 * forecastShotIn });

    const mobile = isMobileLayout();
    const textX = getTextLeft();
    const textW = getTextWidth();

    if (mobile) {
      set(heroTextRef.current, { autoAlpha: 1 - heroOut, left: textX, top: '18%', width: textW, xPercent: -50, yPercent: 0, y: -40 * heroOut, scale: 1 - 0.04 * heroOut });
      set(dashTextRef.current, { autoAlpha: dashTextIn * (1 - dashTextOut), left: textX, top: '18%', width: textW, xPercent: -50, yPercent: 0, y: 30 * (1 - dashTextIn), scale: 0.97 + 0.03 * dashTextIn });
      set(kundliTextRef.current, { autoAlpha: kundliTextIn * (1 - kundliTextOut), left: textX, top: '18%', width: textW, xPercent: -50, yPercent: 0, y: 30 * (1 - kundliTextIn), scale: 0.97 + 0.03 * kundliTextIn });
      set(forecastTextRef.current, { autoAlpha: forecastTextIn * (1 - forecastTextOut), left: textX, top: '18%', width: textW, xPercent: -50, yPercent: 0, y: 30 * (1 - forecastTextIn), scale: 0.97 + 0.03 * forecastTextIn });
      set(astroTextRef.current, { autoAlpha: astroTextIn, left: textX, top: '18%', width: textW, xPercent: -50, yPercent: 0, y: 30 * (1 - astroTextIn), scale: 0.97 + 0.03 * astroTextIn });
    } else {
      set(heroTextRef.current, { autoAlpha: 1 - heroOut, left: textX, top: '50%', width: textW, xPercent: 0, yPercent: -50, x: -60 * heroOut, scale: 1 - 0.04 * heroOut });
      set(dashTextRef.current, { autoAlpha: dashTextIn * (1 - dashTextOut), left: textX, top: '50%', width: textW, xPercent: 0, yPercent: -50, x: 40 * (1 - dashTextIn), scale: 0.97 + 0.03 * dashTextIn });
      set(kundliTextRef.current, { autoAlpha: kundliTextIn * (1 - kundliTextOut), left: textX, top: '50%', width: textW, xPercent: 0, yPercent: -50, x: 40 * (1 - kundliTextIn), scale: 0.97 + 0.03 * kundliTextIn });
      set(forecastTextRef.current, { autoAlpha: forecastTextIn * (1 - forecastTextOut), left: textX, top: '50%', width: textW, xPercent: 0, yPercent: -50, x: 40 * (1 - forecastTextIn), scale: 0.97 + 0.03 * forecastTextIn });
      set(astroTextRef.current, { autoAlpha: astroTextIn, left: textX, top: '50%', width: textW, xPercent: 0, yPercent: -50, x: 40 * (1 - astroTextIn), scale: 0.97 + 0.03 * astroTextIn });
    }

    set(browserChromeRef.current, { autoAlpha: chromeIn * (1 - browserOut) });
    const peekCX = rect.x + rect.w / 2;
    const peekCY = rect.y + rect.h * 0.12;
    set(peekLeftRef.current, {
      autoAlpha: 0.28 * (1 - peekOut),
      left: peekCX,
      top: peekCY,
      xPercent: -50,
      yPercent: 0,
      x: lerp(-86, -118, peekOut),
      y: lerp(18, 4, peekOut),
      rotate: lerp(-7, -12, peekOut),
      scale: 0.98,
    });

    set(astrologersGridRef.current, { autoAlpha: astroGridIn });

    const section = sectionRef.current;
    if (section && astrologersGridRef.current) {
      const sw = section.clientWidth;
      const sh = section.clientHeight;
      if (mobile) {
        gsap.set(astrologersGridRef.current, {
          left: (sw - Math.min(sw * 0.88, 640)) / 2,
          top: sh * 0.42,
          width: Math.min(sw * 0.88, 640),
        });
      } else {
        const rX = textX + textW + 56;
        const rW = sw - rX - 56;
        gsap.set(astrologersGridRef.current, {
          left: rX, top: (sh - 360) / 2,
          width: rW,
        });
      }
    }

    if (urlTextRef.current) {
      let url = 'astranavi.com/dashboard';
      if (p > 0.50) url = 'astranavi.com/kundli';
      if (p > 0.70) url = 'astranavi.com/forecast';
      urlTextRef.current.textContent = url;
    }

    const card = cardRef.current;
    if (card) {
      const borderW = lerp(2.5, 1, morph);
      const borderAlpha = lerp(0.48, 0.16, morph);
      card.style.borderWidth = `${borderW}px`;
      card.style.borderColor = `rgba(110,133,118,${borderAlpha})`;
      const bgDark = lerp(1, 0, morph);
      card.style.backgroundColor = `rgb(${9 + bgDark * 6}, ${8 + bgDark * 9}, ${22 + bgDark * 8})`;
      card.style.boxShadow = morph < 0.35
        ? '0 28px 95px rgba(122, 255, 190, 0.16), 0 16px 70px rgba(231, 176, 68, 0.13), 0 0 0 1px rgba(255,255,255,0.07)'
        : '0 28px 90px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.05)';
    }
  }, [getRects, applyRect, getTextLeft, getTextWidth]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    render(0);
    const scroller = getPageScroller();

    const st = ScrollTrigger.create({
      trigger: section,
      scroller,
      start: () => `top top+=${getNavHeight()}`,
      end: () => `+=${window.innerHeight * (isMobileLayout() ? 5.5 : 6.8)}`,
      scrub: 0.85,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });

    stRef.current = st;

    const onResize = () => {
      ScrollTrigger.refresh();
      render(lastProgressRef.current);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [render]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-transparent"
      style={{ height: 'calc(100vh - var(--navbar-height, 72px))' }}
    >
      <div ref={heroTextRef} className="absolute z-10 pointer-events-none" style={{ opacity: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/35 mb-6">
          <Sparkles className="text-secondary w-3.5 h-3.5" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">AI-Powered Vedic Astrology</span>
        </div>
        <h1 className="font-headline font-bold text-primary leading-[1.1] mb-5 text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight">
          Your Cosmic Journey,<br /><span className="text-secondary italic">Finally Understood.</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/80 max-w-xl leading-relaxed font-body mb-8">
          AI-powered Vedic astrology for daily guidance, Kundli insights, forecasts, and personal questions.
        </p>
        <div className="hidden lg:flex flex-row items-center gap-4 pointer-events-auto">
          <Button href="/login?action=register" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />} className="gold-gradient shadow-xl px-8">Let&apos;s get started</Button>
          <Button href="/chat" variant="secondary" size="lg" leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />} className="px-8 border-outline-variant/40 text-primary hover:border-secondary/50">Ask Navi</Button>
        </div>
        <div className="flex lg:hidden flex-row items-center gap-3 pointer-events-auto">
          <Button href="/login?action=register" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="gold-gradient shadow-xl px-5 flex-1">Get started</Button>
          <Button href="/chat" variant="secondary" size="md" leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />} className="px-5 shrink-0 border-outline-variant/40 text-primary">Ask Navi</Button>
        </div>
      </div>

      <div ref={dashTextRef} className="absolute z-10 pointer-events-none" style={{ opacity: 0 }}>
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 03 — Dashboard</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Everything your day needs in one place.</h2>
            <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">See your daily score, life areas, timing windows, weekly trend, and personal guidance without jumping between screens.</p>
          </div>
          <ul className="space-y-3 font-body">
            {['Daily cosmic energy score out of 100', 'Detailed breakdown of Career, Finance, Health, and Love', 'Auspicious timing windows (Good Time) and caution windows (Rahu Kaal)', 'Interactive weekly dasha trends graph', 'Quick action buttons to Ask Navi AI questions directly'].map((b, i) => (
              <li key={i} className={`${i > 2 ? 'hidden sm:flex' : 'flex'} items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70`}>
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /><span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 pointer-events-auto"><Button href="/dashboard" rightIcon={<ArrowRight className="w-4 h-4" />}>Explore Your Dashboard</Button></div>
        </div>
      </div>

      <div ref={kundliTextRef} className="absolute z-10 pointer-events-none" style={{ opacity: 0 }}>
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 04 — Kundli Chart</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Your birth chart, made readable.</h2>
            <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">AstraNavi turns your Kundli into clear chart context, planetary strengths, houses, and personal insights.</p>
          </div>
          <ul className="space-y-3 font-body">
            {['Full Vedic Janam Kundli / Lagna Chart rendering', 'Comprehensive planetary powers (Shadbala calculations)', 'Varga (Divisional) charts including Navamsha (D9) & Dashamsha (D10)', 'Explanations of houses, signs, and planetary placements', 'Clear insights into your core identity and element distribution'].map((b, i) => (
              <li key={i} className={`${i > 2 ? 'hidden sm:flex' : 'flex'} items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70`}>
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /><span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 pointer-events-auto"><Button href="/login?action=register" rightIcon={<ArrowRight className="w-4 h-4" />}>Let&apos;s get started</Button></div>
        </div>
      </div>

      <div ref={forecastTextRef} className="absolute z-10 pointer-events-none" style={{ opacity: 0 }}>
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 05 — Transit Forecasts</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Understand the timing before it happens.</h2>
            <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">Track how transits shift your career, love, finance, health, and overall energy across the week.</p>
          </div>
          <ul className="space-y-3 font-body">
            {['Weekly forecast graph mapping transit energy shifts', 'Life Area tabs for specific, targeted predictions', 'Detailed 7-day breakdown of transits and lunar phases', 'Best day and most challenging day indicators', 'Muhurta timing filters for planning important activities'].map((b, i) => (
              <li key={i} className={`${i > 2 ? 'hidden sm:flex' : 'flex'} items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70`}>
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /><span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 pointer-events-auto"><Button href="/horoscope/forecast" rightIcon={<ArrowRight className="w-4 h-4" />}>View Detailed Forecast</Button></div>
        </div>
      </div>

      <div ref={astroTextRef} className="absolute z-10 pointer-events-none" style={{ opacity: 0 }}>
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 06 — Ask Navi AI</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Ask with context.</h2>
            <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">Navi and specialized AI guides use your chart, daily timing, and selected life area to give focused, actionable answers.</p>
          </div>
          <ul className="space-y-3 font-body hidden sm:block">
            {['Chat with Navi for general Vedic guidance & question answering', 'Arya provides specific advice on Career, business, and education', 'Meera specializes in relationships, love, and Guna matching', 'Anand advises on health timings, Ayurvedic principles, and vitality', 'Vidya analyzes wealth charts, investments, and financial Dashas', 'Rishi digs into spiritual path, divisional details, and deep yogas'].map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" /><span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 pointer-events-auto"><Button href="/chat" rightIcon={<ArrowRight className="w-4 h-4" />}>Start AI Session</Button></div>
        </div>
      </div>

      <div ref={peekLeftRef} className="absolute z-[2] pointer-events-none hidden sm:block" style={{ opacity: 0 }}>
        <div className="w-[160px] sm:w-[210px] lg:w-[245px] rounded-[30px] sm:rounded-[36px] border border-white/10 bg-[#0f1220] shadow-2xl overflow-hidden aspect-[1170/2532] select-none relative">
          <RearPhonePreview />
        </div>
      </div>

      <div ref={cardRef} className="absolute z-[3] overflow-hidden border border-white/10 bg-[#0f1220]" style={{ left: 0, top: 0, width: 300, height: 620, borderRadius: 38, willChange: 'left, top, width, height, border-radius, transform' }}>
        <div ref={browserChromeRef} className="absolute top-0 inset-x-0 z-20 bg-surface-variant/30 border-b border-outline-variant/20 px-4 py-2.5 flex items-center justify-between" style={{ opacity: 0, height: 34 }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <div ref={urlTextRef} className="text-[9px] font-mono text-on-surface-variant/40 bg-surface-variant/20 px-4 py-0.5 rounded-md border border-outline-variant/10">
            astranavi.com/dashboard
          </div>
          <div className="w-10" />
        </div>

        <div ref={mobileShotRef} className="absolute inset-0" style={{ opacity: 0, willChange: 'opacity, transform' }}>
          <HeroPhonePreview />
        </div>
        <img ref={dashShotRef} src="/images/dashboard-desktop.png" alt="AstraNavi Desktop Dashboard" className="absolute left-0 right-0 bottom-0 top-[34px] w-full h-[calc(100%-34px)] object-cover object-center bg-[#0b0619]" style={{ opacity: 0, willChange: 'opacity, transform', filter: 'brightness(1.1) contrast(1.06)' }} />
        <img ref={kundliShotRef} src="/images/kundli-desktop.png" alt="AstraNavi Kundli Desktop" className="absolute left-0 right-0 bottom-0 top-[34px] w-full h-[calc(100%-34px)] object-cover object-top bg-[#0b0619]" style={{ opacity: 0, willChange: 'opacity, transform', filter: 'brightness(1.08) contrast(1.05)' }} />
        <img ref={forecastShotRef} src="/images/forecast-desktop.png" alt="AstraNavi Forecast Desktop" className="absolute left-0 right-0 bottom-0 top-[34px] w-full h-[calc(100%-34px)] object-cover object-top bg-[#0b0619]" style={{ opacity: 0, willChange: 'opacity, transform', filter: 'brightness(1.08) contrast(1.05)' }} />
      </div>
    </section>
  );
}

function HeroPhonePreview() {
  return (
    <div className="absolute inset-0 bg-[#101620]">
      <img
        src="/images/dashboard-mobile.png"
        alt="AstraNavi mobile dashboard"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: 'brightness(1.22) contrast(1.1) saturate(1.08)',
          objectPosition: '50% 40%',
          transform: 'scale(1.08)',
          transformOrigin: '50% 42%',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_18%,transparent_78%,rgba(0,0,0,0.18))]" />
      <div className="absolute inset-[1px] rounded-[inherit] pointer-events-none ring-1 ring-white/10" />
    </div>
  );
}

function RearPhonePreview() {
  return (
    <div className="absolute inset-0 bg-[#101620]">
      <img
        src="/images/kundli-mobile.png"
        alt="AstraNavi Kundli preview"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: 'brightness(0.92) contrast(1.04) saturate(0.95)',
          objectPosition: '50% 36%',
          transform: 'scale(1.07)',
          transformOrigin: '50% 38%',
        }}
      />
      <div className="absolute inset-0 bg-[#050613]/20" />
    </div>
  );
}
