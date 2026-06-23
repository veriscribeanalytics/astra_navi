'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Compass, CalendarDays, Bot, 
  CheckCircle2, ArrowRight, Star, GraduationCap, 
  Heart, HeartPulse, Coins, BookOpen
} from 'lucide-react';
import Button from '../ui/Button';
import LandingImage from './LandingImage';

interface TabItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'kundli', name: 'Vedic Kundli', icon: Compass },
  { id: 'forecast', name: 'Transit Forecast', icon: CalendarDays },
  { id: 'astrologers', name: 'AI Astrologers', icon: Bot },
];

const ASTROLOGERS = [
  { 
    name: 'Navi', 
    role: 'General Vedic Guide', 
    avatar: '/images/avatars/NAVI_AVATAR.jpeg',
    specialty: 'Birth chart & daily guidance',
    icon: Star,
    color: 'from-amber-500/20 to-yellow-600/20'
  },
  { 
    name: 'Arya', 
    role: 'Career Mentor', 
    avatar: '/images/avatars/ARYA_AVATAR.jpeg',
    specialty: 'Dasha timings & career choices',
    icon: GraduationCap,
    color: 'from-blue-500/20 to-indigo-600/20'
  },
  { 
    name: 'Meera', 
    role: 'Relationship Guide', 
    avatar: '/images/avatars/MEERA_AVATAR.jpeg',
    specialty: 'Guna matching & love transits',
    icon: Heart,
    color: 'from-rose-500/20 to-pink-600/20'
  },
  { 
    name: 'Anand', 
    role: 'Health Advisor', 
    avatar: '/images/avatars/ANAND_AVATAR.jpeg',
    specialty: 'Ayurvedic balance & wellness timings',
    icon: HeartPulse,
    color: 'from-emerald-500/20 to-teal-600/20'
  },
  { 
    name: 'Vidya', 
    role: 'Financial Astrologer', 
    avatar: '/images/avatars/VIDYA_AVATAR.jpeg',
    specialty: 'Wealth yogas & transit windows',
    icon: Coins,
    color: 'from-amber-600/20 to-orange-700/20'
  },
  { 
    name: 'Rishi', 
    role: 'Deep Chart Sage', 
    avatar: '/images/avatars/RISHI_AVATAR.jpeg',
    specialty: 'Divisional charts & spiritual path',
    icon: BookOpen,
    color: 'from-purple-500/20 to-violet-600/20'
  },
];

export default function CosmicShowcase() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderLeftContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard-text"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 03 — Dashboard</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
                Everything your day needs in one place.
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">
                See your daily score, life areas, timing windows, weekly trend, and personal guidance without jumping between screens.
              </p>
            </div>
            <ul className="space-y-3 font-body">
              {[
                'Daily cosmic energy score out of 100',
                'Detailed breakdown of Career, Finance, Health, and Love',
                'Auspicious timing windows (Good Time) and caution windows (Rahu Kaal)',
                'Interactive weekly dasha trends graph',
                'Quick action buttons to Ask Navi AI questions directly'
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button href="/dashboard" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Your Dashboard
              </Button>
            </div>
          </motion.div>
        );
      case 'kundli':
        return (
          <motion.div
            key="kundli-text"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 04 — Kundli Chart</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
                Your birth chart, made readable.
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">
                AstraNavi turns your Kundli into clear chart context, planetary strengths, houses, and personal insights.
              </p>
            </div>
            <ul className="space-y-3 font-body">
              {[
                'Full Vedic Janam Kundli / Lagna Chart rendering',
                'Comprehensive planetary powers (Shadbala calculations)',
                'Varga (Divisional) charts including Navamsha (D9) & Dashamsha (D10)',
                'Explanations of houses, signs, and planetary placements',
                'Clear insights into your core identity and element distribution'
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button href="/login?action=register" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Let&apos;s get started
              </Button>
            </div>
          </motion.div>
        );
      case 'forecast':
        return (
          <motion.div
            key="forecast-text"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 05 — Transit Forecasts</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
                Understand the timing before it happens.
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">
                Track how transits shift your career, love, finance, health, and overall energy across the week.
              </p>
            </div>
            <ul className="space-y-3 font-body">
              {[
                'Weekly forecast graph mapping transit energy shifts',
                'Life Area tabs for specific, targeted predictions',
                'Detailed 7-day breakdown of transits and lunar phases',
                'Best day and most challenging day indicators',
                'Muhurta timing filters for planning important activities'
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button href="/horoscope/forecast" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Detailed Forecast
              </Button>
            </div>
          </motion.div>
        );
      case 'astrologers':
        return (
          <motion.div
            key="astrologers-text"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] font-body">Section 06 — Ask Navi AI</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-headline text-primary">
                Ask with context.
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed font-body">
                Navi and specialized AI guides use your chart, daily timing, and selected life area to give focused, actionable answers.
              </p>
            </div>
            <ul className="space-y-3 font-body">
              {[
                'Chat with Navi for general Vedic guidance & question answering',
                'Arya provides specific advice on Career, business, and education',
                'Meera specializes in relationships, love, and Guna matching',
                'Anand advises on health timings, Ayurvedic principles, and vitality',
                'Vidya analyzes wealth charts, investments, and financial Dashas',
                'Rishi digs into spiritual path, divisional details, and deep yogas'
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant/70">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Button href="/chat" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start AI Session
              </Button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderRightContent = () => {
    if (activeTab === 'astrologers') {
      return (
        <motion.div
          key="astrologers-assets"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-full flex flex-col gap-6"
        >
          {/* Avatar Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full">
            {ASTROLOGERS.map((astro) => {
              const IconComponent = astro.icon;
              return (
                <div
                  key={astro.name}
                  className="group relative rounded-2xl border border-outline-variant/30 bg-surface-variant/20 p-3 flex flex-col items-center text-center hover:border-secondary/40 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/5"
                >
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2.5 border-2 border-outline-variant/40 group-hover:border-secondary/60 transition-colors">
                    <img
                      src={astro.avatar}
                      alt={astro.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-lg font-bold';
                          fallback.innerText = astro.name[0];
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-primary">{astro.name}</h4>
                    <IconComponent className="w-3 h-3 text-secondary" />
                  </div>
                  
                  <p className="text-[9px] sm:text-[10px] font-bold text-secondary tracking-wide uppercase mt-0.5">{astro.role}</p>
                  <p className="text-[8px] sm:text-[9px] text-on-surface-variant/65 mt-1 leading-snug line-clamp-2">{astro.specialty}</p>
                </div>
              );
            })}
          </div>
          
          <div className="rounded-2xl border border-outline-variant/20 bg-surface/40 p-3 flex items-center gap-3 w-full backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex-grow">
              <div className="text-[10px] font-bold text-primary font-headline">Ask Navi AI Chat Preview</div>
              <p className="text-[8px] sm:text-[9px] text-on-surface-variant/60">"Based on your Saturn Dasha in the 10th house, professional transitions are favored..."</p>
            </div>
            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider shrink-0">Try now</span>
          </div>
        </motion.div>
      );
    }

    let imageSrcDesktop = '';
    let imageSrcMobile = '';
    let placeholderName = '';
    let iconType: 'dashboard' | 'kundli' | 'forecast' = 'dashboard';

    if (activeTab === 'dashboard') {
      imageSrcDesktop = '/images/dashboard-desktop.png';
      imageSrcMobile = '/images/dashboard-mobile.png';
      placeholderName = 'Cosmic Dashboard';
      iconType = 'dashboard';
    } else if (activeTab === 'kundli') {
      imageSrcDesktop = '/images/kundli-desktop.png';
      imageSrcMobile = '/images/kundli-mobile.png';
      placeholderName = 'Vedic Kundli Chart';
      iconType = 'kundli';
    } else {
      imageSrcDesktop = '/images/forecast-desktop.png';
      imageSrcMobile = '/images/dashboard-mobile.png'; // Fallback to mobile dashboard since no forecast-mobile.png is uploaded
      placeholderName = 'Transit Predictions';
      iconType = 'forecast';
    }

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full flex flex-col items-center justify-center gap-6 relative"
      >
        {/* Localized glows specifically behind the mockup frames */}
        <div className="absolute w-[280px] sm:w-[450px] h-[200px] sm:h-[300px] bg-[var(--glow-color)] blur-[90px] rounded-full -z-10 pointer-events-none opacity-85 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute w-[220px] sm:w-[350px] h-[160px] sm:h-[240px] bg-accent/10 blur-[100px] rounded-full -z-10 pointer-events-none opacity-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

        {/* Desktop Mockup */}
        <div className="relative w-full rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden aspect-[16/10] hidden sm:block z-10">
          <div className="bg-surface-variant/30 border-b border-outline-variant/20 px-4 py-2.5 flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <div className="text-[9px] font-mono text-on-surface-variant/40 bg-surface-variant/20 px-4 py-0.5 rounded-md border border-outline-variant/10">
              astranavi.com/{activeTab}
            </div>
            <div className="w-10" />
          </div>
          
          <div className="w-full h-[calc(100%-34px)]">
            <LandingImage
              src={imageSrcDesktop}
              alt={`${placeholderName} Desktop`}
              placeholderName={placeholderName}
              aspectRatio="aspect-[16/10]"
              type="desktop"
              icon={iconType}
            />
          </div>
        </div>

        {/* Mobile Mockup */}
        <div className="relative w-[180px] sm:w-[220px] rounded-[36px] border-[6px] border-surface-variant/80 bg-[#070514] shadow-2xl overflow-hidden aspect-[1170/2532] block sm:hidden z-10">
          <div className="absolute top-0 inset-x-0 h-4 bg-[#070514] flex justify-center items-center z-20">
            <div className="w-12 h-1 rounded-full bg-on-surface-variant/20" />
          </div>
          <div className="w-full h-full pt-4">
            <LandingImage
              src={imageSrcMobile}
              alt={`${placeholderName} Mobile`}
              placeholderName={`${placeholderName} Mobile`}
              aspectRatio="aspect-[1170/2532]"
              type="mobile"
              icon={iconType}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="relative px-4 sm:px-8 lg:px-16 py-16 lg:py-24 max-w-[1440px] mx-auto w-full border-b border-outline-variant/10">
      
      {/* Selector Tabs Strip */}
      <div className="flex items-center justify-center mb-12 sm:mb-16">
        <div className="inline-flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 p-1.5 rounded-[22px] bg-surface-variant/30 border border-outline-variant/20 max-w-full">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-[16px] text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'text-on-primary bg-secondary shadow-lg shadow-secondary/15' 
                    : 'text-on-surface-variant/70 hover:text-primary hover:bg-surface-variant/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-on-primary' : 'text-secondary'}`} />
                <span>{tab.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute inset-0 border border-secondary/50 rounded-[16px] pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feature Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center min-h-[480px]">
        {/* Left Side Content (headline, text, bullets) */}
        <div className="lg:col-span-5 w-full">
          <AnimatePresence mode="wait">
            {renderLeftContent()}
          </AnimatePresence>
        </div>

        {/* Right Side Content (screenshot mockup or avatars grid) */}
        <div className="lg:col-span-7 flex justify-center items-center w-full">
          <AnimatePresence mode="wait">
            {renderRightContent()}
          </AnimatePresence>
        </div>
      </div>
      
    </section>
  );
}
