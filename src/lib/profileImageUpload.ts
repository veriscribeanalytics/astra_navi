'use client';

import { clientFetch } from '@/lib/apiClient';
import type { CommitUploadResponse, SignUploadResponse } from '@/types/messages';

export const PROFILE_IMAGE_MAX_BYTES = 2_097_152;
export const PROFILE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ProfileImageValidation = { ok: true } | { ok: false; message: string };

export class ProfileUploadError extends Error {
    step: 'validate' | 'sign' | 'put' | 'commit';
    constructor(step: ProfileUploadError['step'], message: string) {
        super(message);
        this.name = 'ProfileUploadError';
        this.step = step;
    }
}

function looksLikeHeic(file: File): boolean {
    const t = file.type.toLowerCase();
    if (t === 'image/heic' || t === 'image/heif') return true;
    return /\.(heic|heif)$/i.test(file.name);
}

export function validateProfileImage(file: File): ProfileImageValidation {
    if (looksLikeHeic(file)) {
        return {
            ok: false,
            message: "iPhone HEIC photos aren't supported — please convert to JPEG and try again.",
        };
    }
    if (!(PROFILE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
        return { ok: false, message: 'Only JPEG, PNG, or WebP images are allowed.' };
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
        return { ok: false, message: 'Image is too large — the limit is 2 MB.' };
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
        maxBytes: Number(r.maxBytes ?? r.max_bytes ?? PROFILE_IMAGE_MAX_BYTES),
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

export async function uploadProfileImage(file: File): Promise<CommitUploadResponse> {
    const valid = validateProfileImage(file);
    if (!valid.ok) throw new ProfileUploadError('validate', valid.message);

    let signed: SignUploadResponse | null = null;
    try {
        const res = await clientFetch('/api/uploads/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'profile', contentType: file.type, size: file.size }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = res.status === 429
                ? 'Too many uploads right now — please wait a moment and retry.'
                : data.error || data.detail || 'Could not prepare the upload.';
            throw new ProfileUploadError('sign', msg);
        }
        signed = normalizeSign(data);
    } catch (err) {
        if (err instanceof ProfileUploadError) throw err;
        throw new ProfileUploadError('sign', 'Could not prepare the upload.');
    }
    if (!signed) throw new ProfileUploadError('sign', 'Upload service returned an invalid response.');

    try {
        const putRes = await fetch(signed.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': signed.contentType },
            body: file,
            credentials: 'omit',
        });
        if (!putRes.ok) {
            throw new ProfileUploadError('put', 'Upload failed while sending the image. Please retry.');
        }
    } catch (err) {
        if (err instanceof ProfileUploadError) throw err;
        throw new ProfileUploadError('put', 'Upload failed — check your connection and retry.');
    }

    let committed: CommitUploadResponse | null = null;
    try {
        const res = await clientFetch('/api/uploads/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'profile', objectKey: signed.objectKey }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = res.status === 429
                ? 'Too many uploads right now — please wait a moment and retry.'
                : data.error || data.detail || 'Could not finalize the upload.';
            throw new ProfileUploadError('commit', msg);
        }
        committed = normalizeCommit(data);
    } catch (err) {
        if (err instanceof ProfileUploadError) throw err;
        throw new ProfileUploadError('commit', 'Could not finalize the upload.');
    }
    if (!committed) throw new ProfileUploadError('commit', 'Upload service returned an invalid response.');

    return committed;
}
