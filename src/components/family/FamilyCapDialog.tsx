'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation, useFocusTrap } from '@/hooks';

export interface FamilyCapDialogProps {
    open: boolean;
    onClose: () => void;
    /** Backend-provided message (e.g. "Your current plan allows up to 1 family members."). */
    message?: string | null;
    /** Current tier from the error body (e.g. "free"). */
    currentTier?: string | null;
    /** Roster limit from the error body. */
    limit?: number | null;
}

/** Upgrade dialog shown when a roster action hits FAMILY_FREE_TIER_CAP.
 *  Mirrors PaywallCard's modal styling and routes to /plans. */
export default function FamilyCapDialog({ open, onClose, message, currentTier, limit }: FamilyCapDialogProps) {
    const { t } = useTranslation();
    const modalRef = useFocusTrap<HTMLDivElement>(open);

    if (!open) return null;

    const title = t('family.capDialogTitle') || 'Upgrade to add more family';
    const body = message
        || (limit != null
            ? (t('family.capDialogBody') || 'Your current plan allows up to {limit} family members. Upgrade to add more.').replace('{limit}', String(limit))
            : (t('family.capDialogBodyGeneric') || 'Upgrade your plan to add more family members.'));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    className="relative w-full max-w-md bg-surface rounded-[24px] sm:rounded-[32px] border border-secondary/20 shadow-2xl overflow-hidden"
                >
                    <button
                        onClick={onClose}
                        aria-label={t('common.close') || 'Close'}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-variant/30 flex items-center justify-center hover:bg-surface-variant/50 transition-colors z-50 group"
                    >
                        <X className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-amber-500/[0.02] pointer-events-none" />

                    <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_30px_rgba(200,136,10,0.1)]">
                            <Crown className="w-8 h-8 text-secondary" />
                        </div>

                        <h3 className="text-xl font-headline font-bold text-foreground leading-tight">
                            {title}
                        </h3>

                        <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
                            {body}
                        </p>

                        {currentTier && (
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">
                                {(t('paywall.currentTier') || 'Current tier: {tier}').replace('{tier}', currentTier)}
                            </p>
                        )}

                        <Button
                            href="/plans?feature=family_compatibility"
                            variant="primary"
                            size="lg"
                            fullWidth
                            className="rounded-[16px] mt-2"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            {t('family.capDialogCta') || t('paywall.viewPlansUpgrade') || 'View Plans & Upgrade'}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
