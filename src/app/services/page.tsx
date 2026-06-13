'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, LayoutDashboard, Heart, 
  Compass, Globe, Sparkles, TrendingUp, ArrowRight, ShieldAlert, BadgeCheck
} from 'lucide-react';
import Button from '@/components/ui/Button';
import LandingImage from '@/components/home/LandingImage';

interface ServiceDetails {
  id: string;
  title: string;
  shortLabel: string;
  desc: string;
  icon: React.ElementType;
  imgSrc: string;
  placeholderName: string;
  iconType: 'dashboard' | 'kundli' | 'forecast' | 'chat' | 'family';
  href: string;
  type: 'mobile' | 'desktop';
  requiresAuth: boolean;
  pointers: string[];
}

const SERVICES_LIST: ServiceDetails[] = [
  {
    id: 'explore-life-areas',
    title: 'Explore Life Areas',
    shortLabel: 'Life Areas',
    desc: 'Get specialized predictions and charts mapping your Career & Business, Wealth & Finance, Love, and Wellness. Your core cosmic trends are categorized for easy navigation.',
    icon: LayoutDashboard,
    imgSrc: '/images/dashboard-desktop.png',
    placeholderName: 'Life Areas Dashboard',
    iconType: 'dashboard',
    href: '/dashboard',
    type: 'desktop',
    requiresAuth: true,
    pointers: [
      'Daily cosmic energy score out of 100',
      'Detailed breakdown of Career, Finance, Health, and Love',
      'Auspicious timing windows (Good Time) and caution windows (Rahu Kaal)',
      'Interactive weekly dasha trends graph'
    ]
  },
  {
    id: 'family-connect',
    title: 'Friends & Family Connect',
    shortLabel: 'Family Connect',
    desc: 'Create profiles for your loved ones to track their daily cosmic energy scores, check compatibility matching, and view synchronized timing windows to connect.',
    icon: Users,
    imgSrc: '/images/family-mobile.png',
    placeholderName: 'Friends & Family Connect',
    iconType: 'family',
    href: '/family',
    type: 'mobile',
    requiresAuth: true,
    pointers: [
      'Track daily scores of your friends and family members',
      'Compare chart compatibility dynamically',
      'Plan perfect timing windows to communicate and connect',
      'Manage multiple profiles in one dashboard'
    ]
  },
  {
    id: 'transit-forecasts',
    title: 'Transit Forecasts',
    shortLabel: 'Transit Forecasts',
    desc: 'Understand the planetary movements and transitions affecting your life over the week. Plan key activities using our weekly energy graphs.',
    icon: TrendingUp,
    imgSrc: '/images/forecast-desktop.png',
    placeholderName: 'Transit Forecasts Page',
    iconType: 'forecast',
    href: '/horoscope/forecast',
    type: 'desktop',
    requiresAuth: false,
    pointers: [
      'Daily and weekly transit energy trend lines',
      'Custom filters for Career, Finance, Wellness, and Relationships',
      'Specific lunar phase and planetary movement descriptions',
      'Daily breakdown of planet transitions'
    ]
  },
  {
    id: 'ai-astrology-chat',
    title: 'AI Astrology Assistant (Ask Navi)',
    shortLabel: 'Ask Navi AI',
    desc: 'Engage with Navi and domain-expert AI astrologers for personalized readings, remedial suggestions, and real-time answers to your birth chart questions.',
    icon: MessageSquare,
    imgSrc: '/images/dashboard-mobile.png',
    placeholderName: 'AI Chat Session',
    iconType: 'chat',
    href: '/chat',
    type: 'mobile',
    requiresAuth: true,
    pointers: [
      'Chat 24/7 with our core AI counselor Navi',
      'Context-aware readings using your birth chart details',
      'Direct remedies and answers to your life questions',
      'Chat with specialized AI guides for Career, Love, and Health'
    ]
  },
  {
    id: 'guided-consultation',
    title: 'Guided Consultation',
    shortLabel: 'Consultation',
    desc: 'Connect with our guided virtual session space to receive structured, step-by-step astrological consulting customized to your birth details.',
    icon: Compass,
    imgSrc: '/images/dashboard-mobile.png',
    placeholderName: 'Guided Consultation Sessions',
    iconType: 'chat',
    href: '/consult',
    type: 'mobile',
    requiresAuth: true,
    pointers: [
      'Structured virtual session workspace',
      'Step-by-step personalized astrology walkthroughs',
      'Dedicated focus on specific life query domains',
      'Direct actions and remedial guidance flows'
    ]
  },
  {
    id: 'free-kundli-generator',
    title: 'Free Kundli Generator',
    shortLabel: 'Kundli Generator',
    desc: 'Generate your highly detailed Vedic janam kundli birth chart, planetary positions, shadbala calculations, and core identity details.',
    icon: Globe,
    imgSrc: '/images/kundli-desktop.png',
    placeholderName: 'Kundli Chart Generator',
    iconType: 'kundli',
    href: '/kundli',
    type: 'desktop',
    requiresAuth: true,
    pointers: [
      'Generate complete Vedic Janam Kundli charts',
      'View detailed planetary strength (Shadbala metrics)',
      'Explore varga (divisional) charts including Navamsha (D9)',
      'Accurate birth location coordinates mapping'
    ]
  },
  {
    id: 'kundli-matching',
    title: 'Kundli Matching',
    shortLabel: 'Kundli Matching',
    desc: 'Compare and analyze two birth charts using traditional Ashta Koota compatibility metrics, complete with AI explanations of strengths.',
    icon: Heart,
    imgSrc: '/images/kundli-desktop.png',
    placeholderName: 'Kundli Matching Chart',
    iconType: 'kundli',
    href: '/kundli/match',
    type: 'desktop',
    requiresAuth: true,
    pointers: [
      'Traditional Ashta Koota Guna compatibility calculation (score out of 36)',
      'AI-driven psychological compatibility report',
      'Detailed breakdown of mental, physical, and cosmic affinity',
      'Insights on relationship strengths and growth opportunities'
    ]
  }
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<string>(SERVICES_LIST[0].id);

  const activeService = SERVICES_LIST.find(s => s.id === activeTab) || SERVICES_LIST[0];
  const ActiveIcon = activeService.icon;

  return (
    <div className="relative w-full overflow-hidden bg-[#05030f] py-12 sm:py-20 min-h-[calc(100vh-var(--navbar-height,64px))] flex flex-col justify-center">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16 w-full flex-grow flex flex-col">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/35">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">Our Offerings</span>
          </div>
          
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-primary leading-tight">
            Our Astrology <span className="text-secondary italic">Services</span>
          </h1>
          
          <p className="text-xs sm:text-base text-on-surface-variant/80 max-w-xl mx-auto leading-relaxed font-body">
            Select a service below to explore its features, view its preview mockup, and launch the tool directly.
          </p>
        </div>

        {/* Tab Buttons bar (Scrollable horizontally on mobile, flex row on desktop) */}
        <div className="w-full flex overflow-x-auto pb-4 mb-8 sm:mb-12 border-b border-outline-variant/10 no-scrollbar gap-2 justify-start lg:justify-center">
          {SERVICES_LIST.map((service) => {
            const TabIcon = service.icon;
            const isActive = service.id === activeTab;
            return (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-bold font-body transition-all duration-300 whitespace-nowrap border cursor-pointer ${
                  isActive 
                    ? 'gold-gradient text-white border-transparent shadow-lg shadow-secondary/15' 
                    : 'bg-surface-variant/10 text-on-surface-variant/60 border-outline-variant/30 hover:border-secondary/35 hover:text-primary'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-secondary'}`} />
                {service.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Split Showcase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full items-center">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-6 flex flex-col space-y-6 text-left">
            <div className="space-y-4">
              {/* Access Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant/10 border border-outline-variant/30 w-fit">
                {activeService.requiresAuth ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-secondary font-body">Requires Account Login</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 font-body">Free Public Access</span>
                  </>
                )}
              </div>

              {/* Title & Icon */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary leading-tight">
                  {activeService.title}
                </h2>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-on-surface-variant/75 leading-relaxed font-body">
                {activeService.desc}
              </p>
            </div>

            {/* Bullet Points / Pointers */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold text-secondary font-body">Key Capabilities</h4>
              <ul className="space-y-3 font-body">
                {activeService.pointers.map((pointer, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 text-xs sm:text-sm text-on-surface-variant/80"
                  >
                    <span className="w-5 h-5 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 text-secondary font-bold text-[10px]">
                      ✓
                    </span>
                    <span className="leading-normal">{pointer}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Button
                href={activeService.href}
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="gold-gradient shadow-xl px-8 w-full sm:w-auto text-sm"
              >
                {activeService.requiresAuth ? 'Launch Service / Login' : 'Open Service'}
              </Button>
            </div>
          </div>

          {/* Right Column: Clean Mockup Image */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <div className="relative w-full max-w-[580px] aspect-[1200/800] rounded-3xl border border-outline-variant/35 bg-surface-variant/10 overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeService.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <LandingImage
                    src={activeService.imgSrc}
                    alt={activeService.title}
                    placeholderName={activeService.placeholderName}
                    aspectRatio="aspect-[1200/800]"
                    type={activeService.type}
                    icon={activeService.iconType}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
