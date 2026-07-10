'use client';

import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFocusTrap, useTranslation } from '@/hooks';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: 'inaccurate' | 'harmful' | 'offensive' | 'other', details: string) => void;
}

type Reason = 'inaccurate' | 'harmful' | 'offensive' | 'other';

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  const reasons: { value: Reason; label: string }[] = [
    { value: 'inaccurate', label: t('chat.reportReasonInaccurate') },
    { value: 'harmful', label: t('chat.reportReasonHarmful') },
    { value: 'offensive', label: t('chat.reportReasonOffensive') },
    { value: 'other', label: t('chat.reportReasonOther') },
  ];

  const handleClose = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details.trim());
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div ref={modalRef} className="relative w-full max-w-md bg-surface border border-outline-variant/30 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10 flex-shrink-0">
          <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <Flag className="w-4 h-4 text-secondary" />
            {t('chat.reportTitle')}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-on-surface/5 text-on-surface-variant transition-colors"
            aria-label={t('chat.reportCancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Reasons */}
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('chat.reportTitle')}>
            {reasons.map(({ value, label }) => {
              const isSelected = reason === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setReason(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border text-left transition-all ${
                    isSelected
                      ? 'bg-secondary/10 border-secondary text-on-surface'
                      : 'bg-on-surface/5 border-outline-variant/20 text-on-surface-variant hover:border-secondary/40'
                  }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-secondary' : 'border-on-surface-variant/40'}`}>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-secondary" />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Details */}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            placeholder={t('chat.reportDetailsPlaceholder')}
            className="w-full bg-on-surface/5 border border-outline-variant/20 rounded-2xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/40 transition-colors resize-none min-h-[90px]"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 flex justify-end gap-3 bg-on-surface/2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-on-surface/5 transition-colors"
          >
            {t('chat.reportCancel')}
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!reason}
            className="px-8 shadow-lg shadow-secondary/20 font-bold"
          >
            {t('chat.reportSubmit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
