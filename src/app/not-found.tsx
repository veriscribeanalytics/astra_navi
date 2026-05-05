import React from 'react';
import Link from 'next/link';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | AstraNavi',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px]" />
      
      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 rounded-full border-2 border-secondary/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-secondary animate-pulse" />
          </div>
          <div className="absolute -inset-4 rounded-full border border-dashed border-secondary/10 animate-[spin_20s_linear_infinite]" />
        </div>

        <h1 className="text-7xl font-headline font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-4">The Stars are Obscured</h2>
        <p className="text-foreground/60 mb-10 leading-relaxed font-body">
          The celestial path you are looking for has drifted out of alignment. Even in the vast cosmos, some coordinates remain hidden.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" size="lg" className="gold-gradient flex items-center gap-2">
            <Home size={18} />
            Back to Earth
          </Button>
          <Button href="/chat" variant="secondary" size="lg" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            Consult Navi
          </Button>
        </div>
      </div>
      
      {/* Shooting star effect placeholder or CSS animation could go here */}
    </div>
  );
}
