'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { clientFetch } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks';

interface OpenMessageButtonProps {
    connectionId: number;
    /** Disable when the connection is disconnected (sending would 404/409). */
    disabled?: boolean;
    size?: 'sm' | 'md';
    variant?: 'primary' | 'secondary' | 'ghost';
    className?: string;
}

/**
 * Opens (or creates) the 1:1 thread for a connection, then routes to it.
 * POST is idempotent server-side, so tapping repeatedly is safe.
 */
const OpenMessageButton: React.FC<OpenMessageButtonProps> = ({
    connectionId,
    disabled = false,
    size = 'sm',
    variant = 'secondary',
    className = '',
}) => {
    const router = useRouter();
    const { error: toastError } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const open = async () => {
        if (loading || disabled) return;
        setLoading(true);
        try {
            const res = await clientFetch(`/api/messages/connections/${connectionId}`, {
                method: 'POST',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 404) {
                    toastError(t('messages.connectionGone') || "You're no longer connected.");
                } else {
                    toastError(body.error || body.detail || (t('messages.openFailed') || 'Could not open conversation.'));
                }
                return;
            }
            const threadId = body?.threadId ?? body?.thread_id;
            if (typeof threadId === 'number') {
                router.push(`/messages/${threadId}`);
            } else {
                toastError(t('messages.openFailed') || 'Could not open conversation.');
            }
        } catch {
            toastError(t('messages.openFailed') || 'Could not open conversation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={open}
            disabled={disabled || loading}
            className={className}
            leftIcon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
        >
            {t('messages.messageCta') || 'Message'}
        </Button>
    );
};

export default OpenMessageButton;
