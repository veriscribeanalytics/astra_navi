'use client';

import React from 'react';
import { Clock, AlertTriangle, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DstConflictDialogProps {
    /** Message from the backend about the DST conflict */
    message?: string;
    /** Called when user selects first occurrence (birthTimeFold=0) */
    onSelectFirst: () => void;
    /** Called when user selects second occurrence (birthTimeFold=1) */
    onSelectSecond: () => void;
    /** Called when user cancels */
    onCancel: () => void;
}

export default function DstConflictDialog({
    message = 'Your birth time falls during a Daylight Saving Time transition. The same clock time occurred twice that day. Please select which occurrence was your actual birth time.',
    onSelectFirst,
    onSelectSecond,
    onCancel,
}: DstConflictDialogProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-surface border border-outline-variant/20 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-headline font-bold text-foreground">Ambiguous Birth Time</h3>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">DST Transition Detected</p>
                    </div>
                </div>

                {/* Explanation */}
                <p className="text-sm text-foreground/70 leading-relaxed mb-6">
                    {message}
                </p>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    <button
                        type="button"
                        onClick={onSelectFirst}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-variant/20 border border-outline-variant/10 hover:border-secondary/30 hover:bg-secondary/5 transition-all text-left group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                            <Clock className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">First Occurrence</p>
                            <p className="text-[10px] text-foreground/50">Earlier clock time before DST rollback</p>
                        </div>
                        <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Fold 0</span>
                    </button>

                    <button
                        type="button"
                        onClick={onSelectSecond}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-variant/20 border border-outline-variant/10 hover:border-secondary/30 hover:bg-secondary/5 transition-all text-left group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                            <Check className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">Second Occurrence</p>
                            <p className="text-[10px] text-foreground/50">Later clock time after DST rollback</p>
                        </div>
                        <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Fold 1</span>
                    </button>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={onCancel}
                    className="!rounded-xl"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}