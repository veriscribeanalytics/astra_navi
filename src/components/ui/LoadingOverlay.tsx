'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Aligning your celestial path...", isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">
        
        {/* Ambient Cosmic Glow */}
        <div className="absolute w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-celestial-pulse"></div>
        
        {/* The Loader Core */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          
          {/* Outer Orbit Ring */}
          <div className="absolute inset-0 border border-secondary/10 rounded-full scale-110"></div>
          
          {/* Orbiting Planet 1 */}
          <div className="absolute w-3 h-3 bg-secondary rounded-full animate-orbit blur-[1px]"></div>
          
          {/* Inner Orbit Ring */}
          <div className="absolute inset-2 border border-secondary/5 rounded-full scale-90"></div>
          
          {/* Orbiting Planet 2 */}
          <div className="absolute w-2 h-2 bg-secondary/40 rounded-full animate-orbit-reverse"></div>
          
          {/* Central Star (Logo) */}
          <div className="relative z-10 w-12 h-12 rounded-full overflow-hidden border border-secondary/30 bg-surface/50 p-1.5 backdrop-blur-md">
            <Image
              src="/icons/logo.jpeg"
              alt="Astra Navi"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-center">
          <p className="text-secondary font-headline text-lg italic tracking-wide animate-pulse">
            {message}
          </p>
          <div className="mt-2 flex justify-center gap-1">
             <span className="w-1 h-1 bg-secondary/40 rounded-full animate-bounce delay-0"></span>
             <span className="w-1 h-1 bg-secondary/40 rounded-full animate-bounce delay-150"></span>
             <span className="w-1 h-1 bg-secondary/40 rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
