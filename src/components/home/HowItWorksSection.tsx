'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, FormInput, Compass, MessagesSquare, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const STEPS = [
  {
    step: '01',
    title: 'Enter Birth Details',
    desc: 'Enter your exact date, time, and place of birth. Our precise engines calculate your divisional Kundli charts instantly.',
    icon: FormInput,
    color: 'from-amber-500/10 to-yellow-600/10',
    accentColor: 'text-amber-500',
    renderSnippet: () => (
      <div className="w-full bg-[#0a071d] rounded-xl border border-outline-variant/20 p-3.5 space-y-2.5 text-left pointer-events-none select-none">
        <div className="flex justify-between items-center pb-1.5 border-b border-outline-variant/10">
          <span className="text-[9px] uppercase tracking-wider text-secondary font-bold">Birth Profile</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-[7px] text-on-surface-variant/50 font-bold uppercase">Date of Birth</div>
            <div className="h-6 rounded bg-surface-variant/20 border border-outline-variant/15 flex items-center px-2 text-[9px] text-primary">11 June 2026</div>
          </div>
          <div className="space-y-1">
            <div className="text-[7px] text-on-surface-variant/50 font-bold uppercase">Time of Birth</div>
            <div className="h-6 rounded bg-surface-variant/20 border border-outline-variant/15 flex items-center px-2 text-[9px] text-primary">12:04 PM</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[7px] text-on-surface-variant/50 font-bold uppercase">Place of Birth</div>
          <div className="h-6 rounded bg-surface-variant/20 border border-outline-variant/15 flex items-center px-2 text-[9px] text-primary truncate">New Delhi, Delhi, India</div>
        </div>
      </div>
    )
  },
  {
    step: '02',
    title: 'Get Kundli & Insights',
    desc: 'Explore planetary powers, houses, divisional charts, and your daily score for career, finance, health, and love.',
    icon: Compass,
    color: 'from-indigo-500/10 to-purple-600/10',
    accentColor: 'text-secondary',
    renderSnippet: () => (
      <div className="w-full bg-[#0a071d] rounded-xl border border-outline-variant/20 p-3.5 flex items-center gap-3 text-left pointer-events-none select-none">
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--outline-variant)" strokeOpacity="0.2" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--secondary)" strokeWidth="3" strokeDasharray="97" strokeDashoffset="18" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-primary leading-none">81</span>
            <span className="text-[5px] text-on-surface-variant/40 leading-none">Score</span>
          </div>
        </div>
        <div className="flex-grow space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-primary">Daily Cosmic Balance</span>
            <span className="text-[7px] font-bold text-emerald-500 uppercase">Excellent</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-surface-variant/15 rounded p-1 text-center border border-outline-variant/5">
              <div className="text-[6px] text-on-surface-variant/50 font-bold uppercase">Career</div>
              <div className="text-[9px] font-bold text-secondary">88%</div>
            </div>
            <div className="bg-surface-variant/15 rounded p-1 text-center border border-outline-variant/5">
              <div className="text-[6px] text-on-surface-variant/50 font-bold uppercase">Love</div>
              <div className="text-[9px] font-bold text-secondary">79%</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    step: '03',
    title: 'Ask Navi for Guidance',
    desc: 'Chat with specialized AI guides who know your chart context and transit windows to get deep, personal answers.',
    icon: MessagesSquare,
    color: 'from-emerald-500/10 to-teal-600/10',
    accentColor: 'text-emerald-500',
    renderSnippet: () => (
      <div className="w-full bg-[#0a071d] rounded-xl border border-outline-variant/20 p-3.5 space-y-2 text-left pointer-events-none select-none">
        <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/10">
          <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-[7px] font-bold text-secondary">N</div>
          <span className="text-[8px] font-bold text-primary">Ask Navi AI</span>
          <span className="text-[5px] uppercase font-bold bg-secondary/20 text-secondary px-1 py-0.2 rounded ml-auto">Active</span>
        </div>
        <div className="space-y-1.5">
          <div className="bg-surface-variant/10 border border-outline-variant/5 rounded-lg p-1.5 max-w-[85%]">
            <p className="text-[7px] text-on-surface-variant/50 leading-tight">Me: When should I start my new venture?</p>
          </div>
          <div className="bg-secondary/5 border border-secondary/15 rounded-lg p-1.5 max-w-[90%] ml-auto">
            <p className="text-[7.5px] text-primary leading-snug">Navi: Your Jupiter Dasha is active. Plan it between 10:00 AM and 11:30 AM tomorrow for best success.</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function HowItWorksSection() {
  return (
    <section className="relative px-4 sm:px-8 lg:px-16 py-16 lg:py-24 max-w-[1440px] mx-auto w-full border-b border-outline-variant/10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/35 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">Process</span>
        </div>
        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary leading-tight">
          How <span className="text-secondary italic">AstraMitra</span> Works
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant/80 mt-3 font-body">
          Get started in minutes with our streamlined 3-step cosmic path.
        </p>
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
        {STEPS.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative flex flex-col justify-between rounded-3xl border border-outline-variant/35 bg-surface-variant/15 p-6 hover:border-secondary/40 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/[0.03] group min-h-[360px]"
            >
              <div className="space-y-5">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} border border-outline-variant/30 flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-lg font-headline font-bold text-secondary/30 group-hover:text-secondary/60 transition-colors">
                    {item.step}
                  </span>
                </div>

                {/* Text Description */}
                <div className="space-y-2 text-left">
                  <h3 className="text-base sm:text-lg font-bold font-headline text-primary">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant/70 leading-relaxed font-body">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Bottom CSS Snippet preview */}
              <div className="mt-6 pt-4 border-t border-outline-variant/10">
                {item.renderSnippet()}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick CTA underneath */}
      <div className="flex justify-center mt-12 sm:mt-16">
        <Button href="/kundli" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Get Started Now
        </Button>
      </div>
      
    </section>
  );
}
