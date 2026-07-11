'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import { useToast } from '@/hooks';
import { uploadProfileImage, ProfileUploadError, PROFILE_ALLOWED_TYPES } from '@/lib/profileImageUpload';

interface ProfileImageUploadProps {
  size?: number;
  className?: string;
  editable?: boolean;
}

export default function ProfileImageUpload({
  size = 64,
  className = '',
  editable = true,
}: ProfileImageUploadProps) {
  const { user, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Signed GCS URLs (~15 min) can 403 after expiry; track a failed src so we
  // degrade to the initials instead of the broken-image glyph, and re-sign once.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const refreshAttemptedRef = useRef(false);

  const profileImageUrl = previewUrl || user?.profileImageUrl;

  useEffect(() => {
    setFailedUrl(null);
    refreshAttemptedRef.current = false;
  }, [profileImageUrl]);

  const displayName = user?.name || user?.email || '';
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadProfileImage(file);
      setPreviewUrl(result.imageUrl);
      await refreshProfile();
      success(t('profile.imageUploadSuccess') || 'Profile image updated');
    } catch (err) {
      if (err instanceof ProfileUploadError) {
        error(err.message);
      } else {
        error(t('profile.imageUploadFailed') || 'Failed to upload profile image');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [refreshProfile, t, success, error]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const onClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onRemovePreview = useCallback(() => {
    setPreviewUrl(null);
  }, []);

  const acceptTypes = (PROFILE_ALLOWED_TYPES as readonly string[]).join(',');

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-full border-2 border-secondary/30 bg-secondary/10 overflow-hidden ${editable ? 'cursor-pointer' : ''} transition-all ${isUploading ? 'opacity-70' : ''}`}
        onClick={editable && !isUploading ? onClickUpload : undefined}
        role={editable ? 'button' : 'img'}
        aria-label={editable ? 'Change profile image' : 'Profile image'}
      >
        {profileImageUrl && failedUrl !== profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImageUrl}
            alt={displayName}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            onError={() => {
              setFailedUrl(profileImageUrl);
              // Only re-sign the persisted URL, not a local blob/preview.
              if (!previewUrl && !refreshAttemptedRef.current) {
                refreshAttemptedRef.current = true;
                void refreshProfile();
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-headline font-bold text-secondary" style={{ fontSize: size * 0.4 }}>
            {initial}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-surface/60 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      )}

      {editable && !isUploading && (
        <button
          onClick={onClickUpload}
          className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-secondary/90 border-2 border-surface text-on-primary flex items-center justify-center shadow-md hover:bg-secondary transition-colors"
          aria-label="Upload profile image"
        >
          <Camera className="h-3 w-3" />
        </button>
      )}

      {previewUrl && !isUploading && (
        <button
          onClick={onRemovePreview}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-surface border border-outline-variant/30 text-foreground/60 flex items-center justify-center shadow-md hover:text-foreground transition-colors z-10"
          aria-label="Dismiss preview (refresh profile for live URL)"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
