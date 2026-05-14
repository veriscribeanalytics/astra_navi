import React from 'react';

interface AuthFormCardProps {
  children: React.ReactNode;
  className?: string;
}

const AuthFormCard: React.FC<AuthFormCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-surface/5 dark:bg-white/[0.01] backdrop-blur-md rounded-[28px] border border-outline-variant/20 dark:border-white/5 p-5 sm:p-7 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default AuthFormCard;