import React from 'react';

interface RegisterStepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const RegisterStepIndicator: React.FC<RegisterStepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="space-y-3 mt-4">
      {/* Step dots */}
      <div className="flex gap-1.5 3xl:gap-2.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 3xl:h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep ? 'w-8 3xl:w-12 bg-[#c9a03a]' : 'w-2 3xl:w-3 bg-[rgba(190,145,135,0.2)]'
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
              i === currentStep ? 'text-[#c9a03a]' : 'text-[#9d8cb0]/50'
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