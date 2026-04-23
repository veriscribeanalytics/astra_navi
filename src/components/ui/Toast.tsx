'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

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
  duration = 4000,
  onClose 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400); // Give motion time to animate out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-[#1a1233]/95 border-secondary/30',
      text: 'text-secondary',
      glow: 'shadow-[0_0_30px_rgba(200,136,10,0.15)]',
      icon: 'auto_awesome',
      label: 'Divine Success'
    },
    error: {
      bg: 'bg-[#1a1233]/95 border-red-500/30',
      text: 'text-red-500',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]',
      icon: 'motion_photos_paused',
      label: 'Cosmic Obstacle'
    },
    warning: {
      bg: 'bg-[#1a1233]/95 border-orange-500/30',
      text: 'text-orange-500',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.1)]',
      icon: 'priority_high',
      label: 'Spiritual Caution'
    },
    info: {
      bg: 'bg-[#1a1233]/95 border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_30px_rgba(129,140,248,0.1)]',
      icon: 'auto_read_play',
      label: 'Cosmic Insight'
    },
  };

  const currentStyle = styles[type];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0, scale: 0.9 }}
      animate={isExiting ? { x: '100%', opacity: 0, scale: 0.9 } : { x: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        fixed top-6 right-6 z-[99999] max-w-sm w-[calc(100vw-48px)] sm:w-auto
        ${currentStyle.bg} ${currentStyle.glow} border
        rounded-2xl p-4 flex items-center gap-4
      `}
      role="alert"
    >
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10`}>
        <span className={`material-symbols-outlined ${currentStyle.text} text-2xl`}>
          {currentStyle.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-0.5 ${currentStyle.text}`}>
          {currentStyle.label}
        </p>
        <p className="text-sm font-medium text-foreground/90 leading-snug">
          {message}
        </p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 200);
        }}
        className="text-foreground/20 hover:text-foreground/60 transition-colors p-1"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </motion.div>
  );
};

export default Toast;
