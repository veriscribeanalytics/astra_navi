'use client';

/**
 * Direct-message image upload — the 3-step GCS flow.
 *
 *   1. POST /api/uploads/sign   → signed PUT url + temp objectKey
 *   2. PUT  {uploadUrl}         → bytes straight to GCS (NO auth/cookies)
 *   3. POST /api/uploads/commit → permanent objectKey + signed GET url
 *
 * The caller then sends a message with the permanent objectKey as `imageKey`.
 * Validate client-side first (this module) — the backend enforces the same rules.
 */

import { clientFetch } from '@/lib/apiClient';
import type { CommitUploadResponse, SignUploadResponse } from '@/types/messages';

/** Hard rules — mirror the backend (DM image). */
export const DM_IMAGE_MAX_BYTES = 5_242_880; // 5 MB
export const DM_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type DmImageValidation = { ok: true } | { ok: false; message: string };

/** A failed upload step, carrying a user-facing message and the originating step. */
export class DmUploadError extends Error {
    step: 'validate' | 'sign' | 'put' | 'commit';
    constructor(step: DmUploadError['step'], message: string) {
        super(message);
        this.name = 'DmUploadError';
        this.step = step;
    }
}

function looksLikeHeic(file: File): boolean {
    const t = file.type.toLowerCase();
    if (t === 'image/heic' || t === 'image/heif') return true;
    return /\.(heic|heif)$/i.test(file.name);
}

/** Cheap client-side gate before we ask the backend to sign anything. */
export function validateDmImage(file: File): DmImageValidation {
    if (looksLikeHeic(file)) {
        return {
            ok: false,
            message: "iPhone HEIC photos aren't supported — please convert to JPEG and try again.",
        };
    }
    if (!(DM_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
        return { ok: false, message: 'Only JPEG, PNG, or WebP images are allowed.' };
    }
    if (file.size > DM_IMAGE_MAX_BYTES) {
        return { ok: false, message: 'Image is too large — the limit is 5 MB.' };
    }
    if (file.size === 0) {
        return { ok: false, message: "That file looks empty — pick another image." };
    }
    return { ok: true };
}

function normalizeSign(raw: unknown): SignUploadResponse | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const uploadUrl = (r.uploadUrl ?? r.upload_url) as string | undefined;
    const objectKey = (r.objectKey ?? r.object_key) as string | undefined;
    const contentType = (r.contentType ?? r.content_type) as string | undefined;
    if (!uploadUrl || !objectKey || !contentType) return null;
    return {
        uploadUrl,
        objectKey,
        contentType,
        maxBytes: Number(r.maxBytes ?? r.max_bytes ?? DM_IMAGE_MAX_BYTES),
    };
}

function normalizeCommit(raw: unknown): CommitUploadResponse | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const objectKey = (r.objectKey ?? r.object_key) as string | undefined;
    const imageUrl = (r.imageUrl ?? r.image_url) as string | undefined;
    if (!objectKey || !imageUrl) return null;
    return {
        objectKey,
        imageUrl,
        width: Number(r.width ?? 0),
        height: Number(r.height ?? 0),
    };
}

/**
 * Run sign → PUT → commit for a DM image and return the committed result
 * (permanent objectKey + signed GET url + dimensions). Validate first with
 * {@link validateDmImage}. Throws {@link DmUploadError} on any step failure.
 */
export async function uploadDmImage(
    file: File,
    threadId: number
): Promise<CommitUploadResponse> {
    const valid = validateDmImage(file);
    if (!valid.ok) throw new DmUploadError('validate', valid.message);

    // 1. Sign
    let signed: SignUploadResponse | null = null;
    try {
        const res = await clientFetch('/api/uploads/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'dm', contentType: file.type, size: file.size }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = res.status === 429
                ? 'Too many uploads right now — please wait a moment and retry.'
                : data.error || data.detail || 'Could not prepare the upload.';
            throw new DmUploadError('sign', msg);
        }
        signed = normalizeSign(data);
    } catch (err) {
        if (err instanceof DmUploadError) throw err;
        throw new DmUploadError('sign', 'Could not prepare the upload.');
    }
    if (!signed) throw new DmUploadError('sign', 'Upload service returned an invalid response.');

    // 2. PUT bytes straight to GCS. The signed URL carries its own auth — adding
    //    our Authorization header or cookies would break the signature, so omit
    //    credentials entirely. Content-Type MUST equal the signed content type.
    try {
        const putRes = await fetch(signed.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': signed.contentType },
            body: file,
            credentials: 'omit',
        });
        if (!putRes.ok) {
            throw new DmUploadError('put', 'Upload failed while sending the image. Please retry.');
        }
    } catch (err) {
        if (err instanceof DmUploadError) throw err;
        // Network/CORS failures land here.
        throw new DmUploadError('put', 'Upload failed — check your connection and retry.');
    }

    // 3. Commit (verifies thread membership; returns the permanent key + signed GET url).
    let committed: CommitUploadResponse | null = null;
    try {
        const res = await clientFetch('/api/uploads/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'dm', objectKey: signed.objectKey, targetId: threadId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = res.status === 429
                ? 'Too many uploads right now — please wait a moment and retry.'
                : data.error || data.detail || 'Could not finalize the upload.';
            throw new DmUploadError('commit', msg);
        }
        committed = normalizeCommit(data);
    } catch (err) {
        if (err instanceof DmUploadError) throw err;
        throw new DmUploadError('commit', 'Could not finalize the upload.');
    }
    if (!committed) throw new DmUploadError('commit', 'Upload service returned an invalid response.');

    return committed;
}
