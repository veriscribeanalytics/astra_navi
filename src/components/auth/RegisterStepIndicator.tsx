import React from 'react';

interface RegisterStepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const RegisterStepIndicator: React.FC<RegisterStepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="space-y-3 mt-4">
      {/* Step dots */}
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentStep ? 'w-8 bg-secondary' : 'w-2 bg-outline-variant/30'
            }`}
          />
        ))}
      </div>
      {/* Step labels */}
      <div className="flex justify-between">
        {steps.map((label, i) => (
          <span
            key={i}
            className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${
              i === currentStep ? 'text-secondary' : 'text-on-surface-variant/40'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RegisterStepIndicator;