'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Flower2, ArrowRight, LayoutDashboard } from 'lucide-react';
import Button from '../ui/Button';
import LandingImage from './LandingImage';

export default function FinalCtaSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24 max-w-[1440px] mx-auto w-full overflow-hidden">
      <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden border border-secondary/20 bg-surface-variant/10 text-center px-6 sm:px-12 pt-16 pb-24 sm:pb-32 lg:pb-36">
        
        {/* Subtle theme background glows */}
        <motion.div
          initial={{ opacity: 0.1, scale: 0.9 }}
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none -z-10"
        />

        {/* Central Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-secondary/5">
          <Flower2 className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-primary mb-6 max-w-2xl mx-auto leading-[1.1]">
          Start with your birth chart.<br />
          <span className="text-secondary italic">Let AstraNavi explain the rest.</span>
        </h2>

        {/* Short Text */}
        <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/75 mb-10 max-w-xl mx-auto font-body">
          Generate your Kundli, check your day, and ask Navi what it means for you.
        </p>

        {/* 2 Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto relative z-10">
          <Button
            href="/kundli"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="gold-gradient shadow-2xl px-8 w-full sm:w-auto"
          >
            Generate Free Kundli
          </Button>
          <Button
            href="/dashboard"
            variant="secondary"
            size="lg"
            leftIcon={<LayoutDashboard className="w-4 h-4 text-secondary" />}
            className="px-8 w-full sm:w-auto border-outline-variant/40 text-primary hover:border-secondary/45"
          >
            Open Dashboard
          </Button>
        </div>

        {/* Peeking phone preview at the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px] sm:w-[200px] md:w-[220px] aspect-[1170/2532] translate-y-[45%] hover:translate-y-[35%] transition-transform duration-500 ease-out border-[5px] sm:border-[6px] border-surface-variant/80 bg-[#070514] rounded-t-[32px] sm:rounded-t-[40px] overflow-hidden -z-10 shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-3 bg-[#070514] flex justify-center items-center z-20">
            <div className="w-10 h-0.5 rounded-full bg-on-surface-variant/20" />
          </div>
          <div className="w-full h-full pt-3">
            <LandingImage
              src="/images/dashboard-mobile.png"
              alt="AstraNavi CTA Dashboard"
              placeholderName="Dashboard UI"
              aspectRatio="aspect-[1170/2532]"
              type="mobile"
              icon="dashboard"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
