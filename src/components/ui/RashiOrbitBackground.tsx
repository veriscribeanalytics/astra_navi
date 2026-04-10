'use client';

import { memo } from 'react';
import OrbitImages from './OrbitImages';

const rashiData = [
  { image: '/icons/rashi/aries.png', radiusX: 800, radiusY: 120, rotation: -8, duration: 220, size: 110, startOffset: 0 },
  { image: '/icons/rashi/taurus.png', radiusX: 850, radiusY: 130, rotation: 15, duration: 195, size: 110, startOffset: 30 },
  { image: '/icons/rashi/gemini.png', radiusX: 900, radiusY: 110, rotation: -12, duration: 240, size: 110, startOffset: 60 },
  { image: '/icons/rashi/cancer.png', radiusX: 820, radiusY: 125, rotation: 5, duration: 210, size: 110, startOffset: 15 },
  { image: '/icons/rashi/leo.png', radiusX: 880, radiusY: 115, rotation: -20, duration: 255, size: 110, startOffset: 45 },
  { image: '/icons/rashi/virgo.png', radiusX: 840, radiusY: 122, rotation: 10, duration: 200, size: 110, startOffset: 75 },
  { image: '/icons/rashi/libra.png', radiusX: 920, radiusY: 128, rotation: -15, duration: 230, size: 110, startOffset: 22 },
  { image: '/icons/rashi/scorpio.png', radiusX: 860, radiusY: 112, rotation: 8, duration: 215, size: 110, startOffset: 52 },
  { image: '/icons/rashi/sagittarius.png', radiusX: 890, radiusY: 118, rotation: -10, duration: 250, size: 110, startOffset: 82 },
  { image: '/icons/rashi/capricorn.png', radiusX: 810, radiusY: 108, rotation: 12, duration: 205, size: 110, startOffset: 37 },
  { image: '/icons/rashi/aquarius.png', radiusX: 870, radiusY: 124, rotation: -18, duration: 235, size: 110, startOffset: 67 },
  { image: '/icons/rashi/pisces.png', radiusX: 830, radiusY: 126, rotation: 6, duration: 225, size: 110, startOffset: 8 },
];

const RashiOrbitBackground = memo(function RashiOrbitBackground({ 
  iconCount = 12,
  pauseOnScroll = false 
}: { 
  iconCount?: number;
  pauseOnScroll?: boolean;
}) {
  // Show only the requested number of icons (evenly distributed)
  const visibleRashiData = rashiData.filter((_, index) => {
    if (iconCount >= 12) return true;
    const step = Math.floor(12 / iconCount);
    return index % step === 0;
  }).slice(0, iconCount);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ height: '100lvh' }}>
      <div className="absolute inset-0 flex items-center justify-center rashi-orbit-enhanced">
        {visibleRashiData.map((rashi, index) => (
          <div key={index} className="absolute inset-0 flex items-center justify-center rashi-symbol-wrapper">
            <OrbitImages
              images={[rashi.image]}
              altPrefix={`Rashi symbol ${index + 1}`}
              shape="ellipse"
              radiusX={rashi.radiusX}
              radiusY={rashi.radiusY}
              rotation={rashi.rotation}
              duration={rashi.duration}
              itemSize={rashi.size}
              responsive={false}
              baseWidth={1400}
              width={1400}
              height={1400}
              direction="normal"
              fill
              showPath={false}
              paused={pauseOnScroll}
              initialOffset={rashi.startOffset}
            />
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .rashi-orbit-enhanced {
          filter: drop-shadow(0 0 8px rgba(200, 136, 10, 0.3))
                  drop-shadow(0 0 16px rgba(200, 136, 10, 0.2));
        }
        
        .rashi-symbol-wrapper :global(img) {
          filter: brightness(1.2) contrast(1.1);
          opacity: 0.85;
          transition: opacity 0.3s ease, filter 0.3s ease;
          will-change: transform;
        }
        
        /* Enhanced visibility in dark mode */
        :global(.dark) .rashi-symbol-wrapper :global(img) {
          filter: brightness(1.4) contrast(1.2) saturate(1.1);
          opacity: 0.9;
        }
        
        /* Enhanced visibility in light mode */
        :global(.light) .rashi-symbol-wrapper :global(img) {
          filter: brightness(1.1) contrast(1.15) saturate(1.05);
          opacity: 0.8;
        }
        
        /* Performance optimization */
        .rashi-symbol-wrapper {
          content-visibility: auto;
          contain-intrinsic-size: 110px 110px;
        }
        
        /* Subtle glow effect */
        .rashi-orbit-enhanced::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            transparent 40%,
            rgba(200, 136, 10, 0.05) 70%,
            transparent 100%
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
});

export default RashiOrbitBackground;


