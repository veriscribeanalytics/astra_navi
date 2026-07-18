'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ProfileAvatarProps {
    /** Rendered size in px (applied as the img width/height hint). */
    size: number;
    /** Classes for the <img> element. */
    imgClassName?: string;
    /** Classes for the initials fallback element. */
    fallbackClassName?: string;
    /** Shown when no image / the image fails to load and no name is available. */
    defaultInitial?: string;
}

/**
 * The signed-in user's avatar.
 *
 * The backend hands us a SHORT-LIVED signed GCS GET URL (~15 min) for
 * `profileImageUrl`. AuthContext caches it for the whole session, so a
 * long-open tab (or a fresh <img> mount after the signature expires) can hit a
 * 403 and render the browser's broken-image glyph. To avoid that we:
 *   1. render a plain <img> (not next/image) since the URL is query-signed and
 *      ephemeral — the same approach the DM image bubbles use, and
 *   2. on load error, fall back to the initials AND trigger one refreshProfile()
 *      to pull a freshly-signed URL so the avatar self-heals.
 */
export default function ProfileAvatar({
    size,
    imgClassName = '',
    fallbackClassName = '',
    defaultInitial = 'U',
}: ProfileAvatarProps) {
    const { user, refreshProfile } = useAuth();
    // Display order (docs §4): persisted signed GCS URL → Google OAuth picture
    // (user.image) → initials. Keep profileImageUrl first so a stale/deleted
    // signed URL 403s to onError and degrades to the Google picture rather than
    // shadowing it. user.image is a long-lived public Google URL.
    const url = user?.profileImageUrl || user?.image || null;
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    // Re-signing is only attempted once per mount so a genuinely-missing image
    // (deleted object, not just an expired signature) can't loop forever.
    const refreshAttemptedRef = useRef(false);

    // When a fresh URL arrives (e.g. after refreshProfile or a new upload),
    // clear the failed marker so we give the new signature a chance to load.
    useEffect(() => {
        setFailedUrl(null);
    }, [url]);

    const showImage = url && failedUrl !== url;
    const initial = (user?.name?.[0] || user?.email?.[0] || defaultInitial).toUpperCase();

    if (showImage) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={url}
                alt={user?.name || 'User'}
                width={size}
                height={size}
                className={imgClassName}
                onError={() => {
                    setFailedUrl(url);
                    if (!refreshAttemptedRef.current) {
                        refreshAttemptedRef.current = true;
                        void refreshProfile();
                    }
                }}
            />
        );
    }

    return <div className={fallbackClassName}>{initial}</div>;
}
