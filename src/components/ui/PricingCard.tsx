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
        flex flex-col items-center 
        ${isRecommended 
          ? 'border-2 border-secondary relative shadow-xl shadow-secondary/5 md:scale-105 z-20 transition-transform duration-300' 
          : 'transition-transform duration-200 hover:scale-[1.01]'
        }
      `}
    >
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
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
      
      <Button 
        variant={variant} 
        fullWidth 
        className={`mt-auto py-4 rounded-xl ${variant === 'secondary' ? 'border-2' : 'hover:scale-[1.02]'}`}
        onClick={onSubscribe}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

export default PricingCard;
