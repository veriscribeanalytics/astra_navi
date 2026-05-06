'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useMounted } from '@/hooks/useMounted';

const rashiData = [
  { image: '/icons/rashi/aries.png' },
  { image: '/icons/rashi/taurus.png' },
  { image: '/icons/rashi/gemini.png' },
  { image: '/icons/rashi/cancer.png' },
  { image: '/icons/rashi/leo.png' },
  { image: '/icons/rashi/virgo.png' },
  { image: '/icons/rashi/libra.png' },
  { image: '/icons/rashi/scorpio.png' },
  { image: '/icons/rashi/sagittarius.png' },
  { image: '/icons/rashi/capricorn.png' },
  { image: '/icons/rashi/aquarius.png' },
  { image: '/icons/rashi/pisces.png' },
];

const BouncingIcon = ({ image, paused }: { image: string; paused: boolean }) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(0);
  
  const pos = useRef({ 
    x: 50, // Default center
    y: 50,
    vx: 0,
    vy: 0,
    rotation: 0,
    vr: 0 
  });
  
  const size = 110; // px
  
  useEffect(() => {
    // Initialize random values after mount
    startTime.current = Math.random() * 10000;
    pos.current = {
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      vx: (Math.random() * 0.006 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
      vy: (Math.random() * 0.006 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
      rotation: Math.random() * 360,
      vr: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
    };
  }, []);
  
  useEffect(() => {
    let animationId: number;
    
    const update = (time: number) => {
      if (paused) {
        animationId = requestAnimationFrame(update);
        return;
      }

      const icon = iconRef.current;
      if (!icon) return;

      const t = (time + startTime.current) * 0.0005; // Swerve speed

      // Update position (Linear + Circular Swerve)
      pos.current.x += pos.current.vx;
      pos.current.y += pos.current.vy;
      pos.current.rotation += pos.current.vr;

      // Add a circular "swerve" component (like the particles)
      const swerveX = Math.sin(t) * 1.5; // Circular radius in %
      const swerveY = Math.cos(t) * 1.5;

      const displayX = pos.current.x + swerveX;
      const displayY = pos.current.y + swerveY;

      // Bounce logic with swerve accounted for
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const sizeW = (size / winW) * 100;
      const sizeH = (size / winH) * 100;

      if (pos.current.x <= 2 || pos.current.x >= 98 - sizeW) {
        pos.current.vx *= -1;
        pos.current.x = pos.current.x <= 2 ? 2.1 : 97.9 - sizeW;
      }
      
      if (pos.current.y <= 2 || pos.current.y >= 98 - sizeH) {
        pos.current.vy *= -1;
        pos.current.y = pos.current.y <= 2 ? 2.1 : 97.9 - sizeH;
      }

      icon.style.transform = `translate3d(${displayX}vw, ${displayY}vh, 0) rotate(${pos.current.rotation}deg)`;
      
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [paused, size]);

  return (
    <div 
      ref={iconRef}
      className="absolute top-0 left-0 transition-opacity duration-1000"
      style={{ 
        width: size, 
        height: size,
        willChange: 'transform',
        opacity: 0.75
      }}
    >
      <Image 
        src={image} 
        alt="Rashi" 
        fill
        sizes="110px"
        className="object-contain filter-rashi"
      />
    </div>
  );
};

const RashiOrbitBackground = memo(function RashiOrbitBackground({ 
  iconCount = 12,
  pauseOnScroll = false 
}: { 
  iconCount?: number;
  pauseOnScroll?: boolean;
}) {
  const mounted = useMounted();
  
  const visibleRashiData = useMemo(() => {
    return rashiData.filter((_, index) => {
      if (iconCount >= 12) return true;
      const step = Math.floor(12 / iconCount);
      return index % step === 0;
    }).slice(0, iconCount);
  }, [iconCount]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ height: '100lvh' }}>
      <div className="absolute inset-0 rashi-orbit-enhanced">
        {visibleRashiData.map((rashi, index) => (
          <BouncingIcon 
            key={`${index}-${rashi.image}`} 
            image={rashi.image} 
            paused={pauseOnScroll}
          />
        ))}
      </div>
      
      <style jsx>{`
        .rashi-orbit-enhanced {
          background-color: transparent;
        }

        /* The Premium Deep Void Vignette */
        .rashi-orbit-enhanced::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            transparent 0%,
            rgba(4, 2, 10, 0.2) 20%,
            rgba(4, 2, 10, 0.7) 60%,
            rgba(4, 2, 10, 0.95) 100%
          );
          z-index: -1;
          pointer-events: none;
        }

        /* Subtle Purple Wash */
        .rashi-orbit-enhanced::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(6, 4, 15, 0.4);
          z-index: -2;
          pointer-events: none;
        }
        
        :global(.filter-rashi) {
          filter: brightness(0.5) contrast(1.1) grayscale(0.5) drop-shadow(0 0 2px rgba(200, 136, 10, 0.3));
          transition: filter 0.5s ease;
          mix-blend-mode: soft-light;
        }

        :global(.dark .filter-rashi) {
          opacity: 0.2;
          filter: 
            brightness(0.25) 
            contrast(1.3) 
            grayscale(1) 
            drop-shadow(0 0 1px rgba(255, 215, 0, 0.5)) 
            drop-shadow(0 0 3px rgba(255, 215, 0, 0.25));
        }

        :global(.light .filter-rashi) {
          opacity: 0.15;
          filter: 
            brightness(0.4) 
            contrast(1.1) 
            grayscale(1) 
            drop-shadow(0 0 1px rgba(255, 215, 0, 0.3));
        }
      `}</style>
    </div>
  );
});

export default RashiOrbitBackground;


