'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-500',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-500',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-500',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-secondary/10 border-secondary/20',
      text: 'text-secondary',
      icon: Info,
    },
  };

  const currentStyle = styles[type];
  const Icon = currentStyle.icon;

  return (
    <div
      className={`
        fixed top-20 right-4 z-[9999] max-w-sm w-full
        ${currentStyle.bg} border backdrop-blur-xl
        rounded-xl p-4 shadow-2xl
        flex items-center gap-3
        ${isExiting ? 'animate-out fade-out slide-out-to-right-full duration-200' : 'animate-in fade-in slide-in-from-right-full duration-300'}
      `}
      role="alert"
    >
      <Icon className={`${currentStyle.text} w-5 h-5 shrink-0`} />
      <p className={`text-sm font-medium ${currentStyle.text} flex-1`}>
        {message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 200);
        }}
        className={`${currentStyle.text} opacity-60 hover:opacity-100 transition-opacity`}
        aria-label="Close notification"
      >
        <X className="w-4.5 h-4.5" />
      </button>
    </div>
  );
};

export default Toast;
