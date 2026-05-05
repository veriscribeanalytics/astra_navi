'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  initialRating: number;
  onSubmit: (rating: number, tags: string[], comment: string) => void;
}

const FEEDBACK_TAGS_BY_RATING: Record<number, string[]> = {
  1: [
    // Tone issues
    'Tone felt dismissive or rude',
    // Prediction-related issues
    'Completely wrong prediction',
    'Planetary positions were incorrect',
    'Dasha analysis was way off',
    // Other categories
    'Irrelevant to my birth chart',
    'Other',
  ],
  2: [
    // Tone issues
    'Tone felt robotic or impersonal',
    // Prediction-related issues
    'Misread my birth chart details',
    'Wrong planetary transits mentioned',
    'Timing predictions were inaccurate',
    // Other categories
    'Ignored my actual question',
    'Other',
  ],
  3: [
    // Tone issues
    'Tone could be more empathetic',
    // Prediction-related issues
    'Partially accurate but missed key aspects',
    'Planetary combinations not fully explained',
    'Timing predictions felt vague',
    // Other categories
    'Remedies were too generic',
    'Other',
  ],
  4: [
    // Tone issues
    'Tone was warm and supportive',
    // Prediction-related issues
    'Minor inaccuracy in chart details',
    'Transit analysis could go deeper',
    'Dasha insights were brief',
    // Other categories
    'Wanted more specific remedies',
    'Other',
  ],
  5: [
    // Tone issues
    'Tone was compassionate and wise',
    // Prediction-related issues
    'Spot-on prediction accuracy',
    'Excellent planetary analysis',
    'Precise timing insights',
    // Other categories
    'Remedies were practical and helpful',
    'Other',
  ],
};

const PLACEHOLDERS: Record<number, string> = {
  1: 'The stars were completely misaligned here — what felt wrong?',
  2: 'Which part of the reading missed the mark?',
  3: 'What celestial insight was missing from this reading?',
  4: 'Almost aligned — what would make this reading perfect?',
  5: 'What resonated most with your cosmic journey?',
};

const RATING_LABELS: Record<number, string> = {
  1: '☄️ Misaligned',
  2: '🌑 Needs Work',
  3: '🌗 Partial Clarity',
  4: '🌕 Nearly There',
  5: '✨ Cosmically Aligned',
};

const TAG_SECTION_LABELS: Record<number, string> = {
  1: 'What went wrong with this reading?',
  2: 'Where did the reading fall short?',
  3: 'What could improve this insight?',
  4: 'What small thing was missing?',
  5: 'What made this reading shine?',
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  messageId,
  initialRating,
  onSubmit,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setSelectedTags([]);
      setComment('');
    }
  }, [isOpen, initialRating]);

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
      
      <div className="relative w-full max-w-lg bg-surface border border-outline-variant/30 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10 flex-shrink-0">
          <h3 className="text-lg font-headline font-bold text-on-surface">Share feedback</h3>
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
                    className={`text-2xl transition-transform hover:scale-110 active:scale-95 ${
                      isFilled ? 'text-secondary' : 'text-on-surface-variant/20'
                    }`}
                  >
                    {isFilled ? '★' : '☆'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              {RATING_LABELS[rating] || 'Rate'}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-on-surface-variant/70 px-1">{TAG_SECTION_LABELS[rating]}</p>
            <div className="flex flex-wrap gap-2">
              {(FEEDBACK_TAGS_BY_RATING[rating] || []).map((tag: string) => {
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
              placeholder={PLACEHOLDERS[rating] || 'Share details (optional)'}
              className="w-full bg-on-surface/5 border border-outline-variant/20 rounded-2xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/40 transition-colors resize-none min-h-[100px]"
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-on-surface/5 rounded-2xl p-4">
             <p className="text-xs text-on-surface-variant/60 leading-relaxed">
              ✦ Your feedback helps Navi refine its Vedic wisdom. All responses are anonymous and used solely to improve AstraNavi's celestial guidance.
             </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 flex justify-end bg-on-surface/2 flex-shrink-0">
          <Button 
            onClick={handleSubmit}
            className="px-8 shadow-lg shadow-secondary/20 font-bold"
          >
            Submit Feedback
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
