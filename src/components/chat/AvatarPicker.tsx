'use client';

import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, Coins, Sparkles } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useClickOutside, useTranslation } from '@/hooks';
import { getAvatarIcon, getAvatarAccent, getAvatarImage } from '@/utils/avatarStyle';
import type { ChatAvatar } from '@/types/avatar';

export type AvatarPickerHandle = {
  open: () => void;
  toggle: () => void;
};

const AvatarPicker = forwardRef<AvatarPickerHandle>(function AvatarPicker(_props, ref) {
  const { t } = useTranslation();
  const { avatars, selectedAvatarId, setSelectedAvatarId, isLoadingAvatars } = useChat();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef as React.RefObject<HTMLElement>, () => setOpen(false));

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    toggle: () => setOpen(prev => !prev),
  }), []);

  const current: ChatAvatar | undefined = useMemo(
    () => avatars.find(a => a.avatarId === selectedAvatarId),
    [avatars, selectedAvatarId]
  );

  const displayName = current?.name ?? t('chat.avatarPicker.defaultName');
  const displayTitle = current?.title;
  const currentAvatarId = current?.avatarId ?? selectedAvatarId;
  const currentAccent = getAvatarAccent(currentAvatarId);

  if (isLoadingAvatars && avatars.length === 0) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${currentAccent}`}>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/40">{t('chat.avatarPicker.loading')}</p>
      </div>
    );
  }

  // If catalog failed to load, fall back to plain Navi label (no dropdown).
  if (avatars.length === 0) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-7 h-7 rounded-full border overflow-hidden flex items-center justify-center ${currentAccent}`}>
          {getAvatarImage(currentAvatarId) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAvatarImage(currentAvatarId) as string}
              alt={t('chat.avatarPicker.defaultName')}
              className="w-full h-full object-cover"
            />
          ) : (
            React.createElement(getAvatarIcon(currentAvatarId), { className: 'w-3.5 h-3.5' })
          )}
        </div>
        <p className="text-[14px] font-semibold text-foreground/80">{t('chat.avatarPicker.defaultName')}</p>
      </div>
    );
  }

  const handleSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 min-w-0 px-1 py-0.5 -mx-1 rounded-lg hover:bg-surface-variant/30 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('chat.avatarPicker.ariaAvatar')
          .replace('{name}', displayName)
          .replace('{title}', displayTitle ? ', ' + displayTitle : '')}
      >
        <div className={`w-7 h-7 rounded-full border overflow-hidden flex items-center justify-center ${currentAccent}`}>
          {getAvatarImage(currentAvatarId) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAvatarImage(currentAvatarId) as string}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            React.createElement(getAvatarIcon(currentAvatarId), { className: 'w-3.5 h-3.5' })
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[14px] font-semibold text-foreground/80 truncate max-w-[80px] sm:max-w-none">
            {displayName}
          </p>
          {displayTitle && (
            <>
              <span className="w-1 h-1 bg-foreground/15 rounded-full hidden sm:inline-block" />
              <p className="text-[12px] text-foreground/40 truncate hidden sm:inline-block max-w-[140px]">
                {displayTitle}
              </p>
            </>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            role="listbox"
            aria-label={t('chat.avatarPicker.ariaChooseAvatar')}
            className="absolute left-0 top-full mt-2 w-[300px] sm:w-[340px] max-h-[min(70vh,520px)] overflow-y-auto bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-md z-50 p-1.5"
          >
            <div className="px-3 py-2 border-b border-outline-variant/15 mb-1">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
                {t('chat.avatarPicker.chooseGuide')}
              </p>
              <p className="text-[11px] text-foreground/30 mt-0.5">
                {t('chat.avatarPicker.creditsNotice')}
              </p>
            </div>
            {avatars.map(avatar => {
              const accent = getAvatarAccent(avatar.avatarId);
              const isSelected = avatar.avatarId === selectedAvatarId;
              return (
                <button
                  key={avatar.avatarId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(avatar.avatarId)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-secondary/10 border border-secondary/30'
                      : 'border border-transparent hover:bg-surface-variant/30'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center shrink-0 ${accent}`}>
                    {getAvatarImage(avatar.avatarId) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getAvatarImage(avatar.avatarId) as string}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      React.createElement(getAvatarIcon(avatar.avatarId), { className: 'w-4 h-4' })
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground/85 truncate">{avatar.name}</p>
                      <span className="text-[11px] text-foreground/40 truncate">· {avatar.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-secondary shrink-0 ml-auto" />}
                    </div>
                    <p className="text-[11px] text-foreground/45 leading-snug line-clamp-2 mt-0.5">
                      {avatar.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 px-1.5 py-0.5 rounded-full">
                        <Coins className="w-3 h-3" />
                        {avatar.creditCost === 1
                          ? t('chat.avatarPicker.creditSingle').replace('{n}', String(avatar.creditCost))
                          : t('chat.avatarPicker.creditPlural').replace('{n}', String(avatar.creditCost))}
                      </span>
                      {avatar.isDefault && (
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
                          {t('chat.avatarPicker.default')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AvatarPicker;
