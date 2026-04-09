'use client';

import React, { useEffect } from 'react';
import Card from './Card';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const icons = {
    danger: { icon: 'warning', color: 'text-red-500', bg: 'bg-red-500/10' },
    warning: { icon: 'error', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    info: { icon: 'info', color: 'text-secondary', bg: 'bg-secondary/10' },
  };

  const currentIcon = icons[variant];

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <Card 
        className="max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-200" 
        padding="lg"
        hoverable={false}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full ${currentIcon.bg} flex items-center justify-center mb-4`}>
            <span className={`material-symbols-outlined text-3xl ${currentIcon.color}`}>
              {currentIcon.icon}
            </span>
          </div>
          
          <h2 id="dialog-title" className="text-xl font-headline font-bold text-primary mb-2">
            {title}
          </h2>
          
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              fullWidth
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmDialog;
