import React from 'react';
import Image from 'next/image';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  showLogo?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, showLogo = true }) => {
  return (
    <div className="p-4 sm:p-6 pb-2 shrink-0">
      {showLogo && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/icons/logo.jpeg"
              alt="AstraNavi"
              width={40}
              height={40}
              style={{ width: 'auto', height: 'auto' }}
              className="rounded-xl shadow-lg"
            />
            <h2 className="text-lg font-headline font-bold text-primary">AstraNavi</h2>
          </div>
        </div>
      )}

      <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary mb-1 text-center">
        {title}
      </h1>
      <p className="text-xs text-on-surface-variant/80 font-medium text-center">
        {subtitle}
      </p>
    </div>
  );
};

export default AuthHeader;