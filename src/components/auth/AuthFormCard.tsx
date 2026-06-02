import React from 'react';

interface AuthFormCardProps {
  children: React.ReactNode;
  className?: string;
}

const AuthFormCard: React.FC<AuthFormCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`auth-card p-5 sm:p-8 md:p-10 ${className}`}>
      {children}
    </div>
  );
};

export default AuthFormCard;
