'use client';

import { memo } from 'react';
import OrbitImages from './OrbitImages';

const rashiData = [
  { image: '/icons/rashi/aries.png', radiusX: 800, radiusY: 120, rotation: -8, duration: 220, size: 100, startOffset: 0 },
  { image: '/icons/rashi/taurus.png', radiusX: 850, radiusY: 130, rotation: 15, duration: 195, size: 100, startOffset: 30 },
  { image: '/icons/rashi/gemini.png', radiusX: 900, radiusY: 110, rotation: -12, duration: 240, size: 100, startOffset: 60 },
  { image: '/icons/rashi/cancer.png', radiusX: 820, radiusY: 125, rotation: 5, duration: 210, size: 100, startOffset: 15 },
  { image: '/icons/rashi/leo.png', radiusX: 880, radiusY: 115, rotation: -20, duration: 255, size: 100, startOffset: 45 },
  { image: '/icons/rashi/virgo.png', radiusX: 840, radiusY: 122, rotation: 10, duration: 200, size: 100, startOffset: 75 },
  { image: '/icons/rashi/libra.png', radiusX: 920, radiusY: 128, rotation: -15, duration: 230, size: 100, startOffset: 22 },
  { image: '/icons/rashi/scorpio.png', radiusX: 860, radiusY: 112, rotation: 8, duration: 215, size: 100, startOffset: 52 },
  { image: '/icons/rashi/sagittarius.png', radiusX: 890, radiusY: 118, rotation: -10, duration: 250, size: 100, startOffset: 82 },
  { image: '/icons/rashi/capricorn.png', radiusX: 810, radiusY: 108, rotation: 12, duration: 205, size: 100, startOffset: 37 },
  { image: '/icons/rashi/aquarius.png', radiusX: 870, radiusY: 124, rotation: -18, duration: 235, size: 100, startOffset: 67 },
  { image: '/icons/rashi/pisces.png', radiusX: 830, radiusY: 126, rotation: 6, duration: 225, size: 100, startOffset: 8 },
];

const RashiOrbitBackground = memo(function RashiOrbitBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {rashiData.map((rashi, index) => (
          <div key={index} className="absolute inset-0 flex items-center justify-center">
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
              paused={false}
              initialOffset={rashi.startOffset}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default RashiOrbitBackground;

