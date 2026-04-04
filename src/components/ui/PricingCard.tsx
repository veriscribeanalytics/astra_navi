'use client';

import React from 'react';
import Card from './Card';
import Button from './Button';

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  isRecommended?: boolean;
  buttonText?: string;
  variant?: 'primary' | 'secondary';
  onSubscribe?: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  features,
  isRecommended = false,
  buttonText = 'Subscribe Now',
  variant = 'secondary',
  onSubscribe
}) => {
  return (
    <Card 
      padding="lg" 
      allowOverflow={isRecommended}
      className={`
        flex flex-col items-center h-full
        ${isRecommended 
          ? 'border-2 border-secondary relative shadow-2xl shadow-secondary/10 md:scale-105 z-20' 
          : 'border border-secondary/10'
        }
      `}
    >
      {isRecommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow-md z-30">
          Recommended
        </div>
      )}
      
      <h4 className={`text-xl font-headline font-bold mb-2 ${isRecommended ? 'text-secondary' : 'text-primary'}`}>
        {title}
      </h4>
      
      <div className="text-4xl font-bold text-primary mb-8">
        {price}<span className="text-sm font-normal text-primary/40">{period}</span>
      </div>
      
      <ul className="space-y-4 mb-10 text-sm text-primary/70 font-medium text-left w-full">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg select-none">check_circle</span> 
            {feature}
          </li>
        ))}
      </ul>
      
      {/* Spacer to push button to bottom if heights differ */}
      <div className="flex-grow" />

      <Button 
        variant={isRecommended ? 'primary' : 'secondary'} 
        fullWidth 
        className={`mt-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] ${!isRecommended ? 'border-secondary/40' : ''}`}
        onClick={onSubscribe}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

export default PricingCard;
