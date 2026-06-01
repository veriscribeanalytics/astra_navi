'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, Star, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFocusTrap, useTranslation } from '@/hooks';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  initialRating: number;
  onSubmit: (rating: number, tags: string[], comment: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  messageId,
  initialRating,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initialRating);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  const ratingLabels: Record<number, string> = useMemo(() => ({
    1: t('chat.feedback.ratingLabels.1'),
    2: t('chat.feedback.ratingLabels.2'),
    3: t('chat.feedback.ratingLabels.3'),
    4: t('chat.feedback.ratingLabels.4'),
    5: t('chat.feedback.ratingLabels.5'),
  }), [t]);

  const tagSectionLabels: Record<number, string> = useMemo(() => ({
    1: t('chat.feedback.tagSectionLabels.1'),
    2: t('chat.feedback.tagSectionLabels.2'),
    3: t('chat.feedback.tagSectionLabels.3'),
    4: t('chat.feedback.tagSectionLabels.4'),
    5: t('chat.feedback.tagSectionLabels.5'),
  }), [t]);

  const placeholders: Record<number, string> = useMemo(() => ({
    1: t('chat.feedback.placeholders.1'),
    2: t('chat.feedback.placeholders.2'),
    3: t('chat.feedback.placeholders.3'),
    4: t('chat.feedback.placeholders.4'),
    5: t('chat.feedback.placeholders.5'),
  }), [t]);

  const feedbackTagsByRating: Record<number, string[]> = useMemo(() => ({
    1: [
      t('chat.feedback.tags.1.0'),
      t('chat.feedback.tags.1.1'),
      t('chat.feedback.tags.1.2'),
      t('chat.feedback.tags.1.3'),
      t('chat.feedback.tags.1.4'),
      t('chat.feedback.tags.1.5'),
    ],
    2: [
      t('chat.feedback.tags.2.0'),
      t('chat.feedback.tags.2.1'),
      t('chat.feedback.tags.2.2'),
      t('chat.feedback.tags.2.3'),
      t('chat.feedback.tags.2.4'),
      t('chat.feedback.tags.2.5'),
    ],
    3: [
      t('chat.feedback.tags.3.0'),
      t('chat.feedback.tags.3.1'),
      t('chat.feedback.tags.3.2'),
      t('chat.feedback.tags.3.3'),
      t('chat.feedback.tags.3.4'),
      t('chat.feedback.tags.3.5'),
    ],
    4: [
      t('chat.feedback.tags.4.0'),
      t('chat.feedback.tags.4.1'),
      t('chat.feedback.tags.4.2'),
      t('chat.feedback.tags.4.3'),
      t('chat.feedback.tags.4.4'),
      t('chat.feedback.tags.4.5'),
    ],
    5: [
      t('chat.feedback.tags.5.0'),
      t('chat.feedback.tags.5.1'),
      t('chat.feedback.tags.5.2'),
      t('chat.feedback.tags.5.3'),
      t('chat.feedback.tags.5.4'),
      t('chat.feedback.tags.5.5'),
    ],
  }), [t]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    onSubmit(rating, selectedTags, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div ref={modalRef} className="relative w-full max-w-lg bg-surface border border-outline-variant/30 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10 flex-shrink-0">
          <h3 className="text-lg font-headline font-bold text-on-surface">{t('chat.feedback.shareFeedback')}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-on-surface/5 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {/* Stars */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5" onMouseLeave={() => setHoverRating(null)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating ?? rating);
                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => { setRating(star); setSelectedTags([]); }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                      isFilled ? 'text-secondary' : 'text-on-surface-variant/20'
                    }`}
                  >
                    <Star className={`h-6 w-6 ${isFilled ? 'fill-current' : ''}`} />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              {ratingLabels[rating] || ''}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-on-surface-variant/70 px-1">{tagSectionLabels[rating]}</p>
            <div className="flex flex-wrap gap-2">
              {(feedbackTagsByRating[rating] || []).map((tag: string) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                      isSelected 
                      ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/15' 
                      : 'bg-on-surface/5 border-outline-variant/20 text-on-surface-variant hover:border-secondary/40'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
             <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholders[rating] || t('chat.feedback.commentPlaceholder')}
              className="w-full bg-on-surface/5 border border-outline-variant/20 rounded-2xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/40 transition-colors resize-none min-h-[100px]"
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-on-surface/5 rounded-2xl p-4">
             <p className="flex gap-2 text-xs text-on-surface-variant/60 leading-relaxed">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
              <span>{t('chat.feedback.disclaimer')}</span>
             </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 flex justify-end bg-on-surface/2 flex-shrink-0">
          <Button 
            onClick={handleSubmit}
            className="px-8 shadow-lg shadow-secondary/20 font-bold"
          >
            {t('chat.feedback.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
