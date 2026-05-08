'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingMeterProps {
  rating: number | null | undefined;
  onRate: (rating: number) => void;
  size?: 'sm' | 'md';
}

const RatingMeter: React.FC<RatingMeterProps> = ({ rating, onRate, size = 'sm' }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentRating = rating ?? 0;
  const displayRating = hoverRating ?? currentRating;
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <div
        className="flex items-center gap-px"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isActive = star <= currentRating;

          return (
            <button
              key={star}
              type="button"
              className={`!min-w-0 !min-h-0 !p-0.5 flex items-center justify-center w-6 h-6 transition-all duration-200 ${isActive ? 'scale-110' : ''} ${isFilled ? 'text-secondary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'}`}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => onRate(star)}
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={iconSize}
                className={`transition-all duration-200 ${isFilled ? 'fill-secondary' : 'fill-transparent'}`}
              />
            </button>
          );
        })}
      </div>
      {currentRating > 0 && (
        <span className={`font-bold text-secondary ${size === 'md' ? 'text-xs ml-1' : 'text-[10px] ml-0.5'}`}>
          {currentRating.toFixed(1)}/5
        </span>
      )}
      {!currentRating && !hoverRating && size === 'md' && (
        <span className="text-xs ml-1 text-on-surface-variant/40">
          Rate this
        </span>
      )}
    </div>
  );
};

export default RatingMeter;
