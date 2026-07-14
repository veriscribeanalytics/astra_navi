'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  ArrowRight, Sparkles, Users, MessageSquare, Heart
} from 'lucide-react';
import Button from '../ui/Button';
import LandingImage from './LandingImage';

interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  imgSrc: string;
  placeholderName: string;
  iconType: 'dashboard' | 'kundli' | 'forecast' | 'chat' | 'family';
  href: string;
  type: 'mobile' | 'desktop';
}

const SERVICES: ServiceItem[] = [
  {
    id: 'family-connect',
    title: 'Friends & Family Connect',
    desc: 'Create profiles for your loved ones to track their daily cosmic energy scores, check compatibility matching, and view synchronized timing windows to connect.',
    icon: Users,
    imgSrc: '/images/family-mobile.png',
    placeholderName: 'Friends & Family Connect',
    iconType: 'family',
    href: '/family',
    type: 'mobile',
  },
  {
    id: 'guided-consultation',
    title: 'Guided Consultation',
    desc: 'Engage with our domain-expert AI astrologer guides for personalized readings, answer any specific questions, and receive targeted, structured remedies.',
    icon: MessageSquare,
    imgSrc: '/images/dashboard-mobile.png',
    placeholderName: 'Guided Consultation Sessions',
    iconType: 'chat',
    href: '/consult',
    type: 'mobile',
  },
  {
    id: 'explore-life-areas',
    title: 'Explore Life Areas',
    desc: 'Dive deep into specific areas of human experience. Get specialized predictions and charts mapping your Career & Business, Wealth & Finance, and Wellness.',
    icon: LayoutDashboard,
    imgSrc: '/images/dashboard-desktop.png',
    placeholderName: 'Life Areas Dashboard',
    iconType: 'dashboard',
    href: '/dashboard',
    type: 'desktop',
  },
  {
    id: 'kundli-matching',
    title: 'Kundli Matching',
    desc: 'Analyze compatibility between two birth charts using traditional Ashta Koota Guna metrics and AI-driven breakdowns of strengths and potential growth areas.',
    icon: Heart,
    imgSrc: '/images/kundli-desktop.png',
    placeholderName: 'Kundli Matching Chart',
    iconType: 'kundli',
    href: '/kundli/match',
    type: 'desktop',
  },
];

export default function OurServices() {
  return (
    <section className="relative px-4 sm:px-8 lg:px-16 py-16 lg:py-24 max-w-[1440px] mx-auto w-full border-b border-outline-variant/10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/35 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">Services</span>
        </div>
        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary leading-tight">
          Comprehensive Vedic <span className="text-secondary italic">Services</span>
        </h2>
        <p className="text-sm sm:text-base text-on-surface-variant/80 mt-3 font-body">
          AstraNavi integrates ancient wisdom with modern technology to deliver complete cosmic clarity.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full">
        {SERVICES.map((service, idx) => {
          const IconComponent = service.icon;
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group flex flex-col justify-between rounded-3xl border border-outline-variant/35 bg-surface-variant/10 overflow-hidden hover:border-secondary/45 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/[0.02]"
            >
              {/* Image Crop Section */}
              <div className="relative w-full aspect-[1200/800] overflow-hidden border-b border-outline-variant/20 bg-surface">
                <LandingImage
                  src={service.imgSrc}
                  alt={service.title}
                  placeholderName={service.placeholderName}
                  aspectRatio="aspect-[1200/800]"
                  type={service.type}
                  icon={service.iconType}
                  className="group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              {/* Text & Action Section */}
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow space-y-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-headline text-primary">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant/75 leading-relaxed font-body">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] text-secondary font-bold uppercase tracking-[0.15em] font-body group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <Button
                    href={service.href}
                    variant="secondary"
                    size="sm"
                    className="border-outline-variant/40 hover:border-secondary/50 font-bold"
                  >
                    Open Feature
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
}
