'use client';

import React, { useState } from 'react';

interface RatingMeterProps {
  rating: number | null | undefined;
  onRate: (rating: number) => void;
  size?: 'sm' | 'md';
}

const RatingMeter: React.FC<RatingMeterProps> = ({ rating, onRate, size = 'sm' }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentRating = rating ?? 0;
  const displayRating = hoverRating ?? currentRating;
  const starSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="rating-meter-container">
      <div
        className="rating-stars"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isActive = star <= currentRating;

          return (
            <button
              key={star}
              type="button"
              className={`rating-star ${starSize} ${isFilled ? 'rating-star-filled' : 'rating-star-empty'} ${isActive ? 'rating-star-active' : ''}`}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => onRate(star)}
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              {isFilled ? '★' : '☆'}
            </button>
          );
        })}
      </div>
      {currentRating > 0 && (
        <span className={`rating-label ${size === 'md' ? 'text-xs' : 'text-[10px]'}`}>
          {currentRating.toFixed(1)}/5
        </span>
      )}
      {!currentRating && !hoverRating && (
        <span className={`rating-label rating-label-prompt ${size === 'md' ? 'text-xs' : 'text-[10px]'}`}>
          Rate this response
        </span>
      )}
    </div>
  );
};

export default RatingMeter;
