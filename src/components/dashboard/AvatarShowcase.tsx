'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Coins, ChevronRight } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTranslation } from '@/hooks';
import { getAvatarImage, getAvatarIcon, getAvatarAccent } from '@/utils/avatarStyle';
import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton';

const AvatarShowcase: React.FC = () => {
  const { avatars, isLoadingAvatars, setSelectedAvatarId } = useChat();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSelect = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    router.push('/chat');
  };

  if (!isLoadingAvatars && avatars.length === 0) return null;

  return (
    <div className="mt-12 sm:mt-20">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-secondary to-transparent rounded-full" />
          <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.4em] sm:tracking-[0.6em]">
            {t('dashboard.yourGuides')}
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-headline font-bold text-primary tracking-tight">
          {t('dashboard.meetYourGuides')}
        </h2>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-foreground/40 max-w-md mx-auto leading-relaxed px-4">
          {t('dashboard.guidesSubtitle')}
        </p>
      </div>

      {isLoadingAvatars && avatars.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col items-center p-5 rounded-[24px] bg-surface border border-outline-variant/20">
              <SkeletonCircle size={96} />
              <Skeleton height={16} width={80} className="mt-4" />
              <Skeleton height={12} width={100} className="mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {avatars.map((avatar, idx) => {
            const imgSrc = getAvatarImage(avatar.avatarId);
            const accent = getAvatarAccent(avatar.avatarId);
            return (
              <motion.button
                key={avatar.avatarId}
                onClick={() => handleSelect(avatar.avatarId)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                className="group relative flex flex-col items-center text-center h-full p-5 sm:p-6 rounded-[24px] bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] transition-all duration-500"
                aria-label={`Chat with ${avatar.name}, ${avatar.title}`}
              >
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 ${accent} mb-4 group-hover:scale-105 transition-transform duration-500`}>
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={avatar.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {React.createElement(getAvatarIcon(avatar.avatarId), { className: 'w-10 h-10' })}
                    </div>
                  )}
                </div>
                <p className="text-[15px] sm:text-base font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
                  {avatar.name}
                </p>
                <p className="text-[10px] sm:text-[11px] text-foreground/40 uppercase tracking-[0.15em] mt-1 font-bold">
                  {avatar.title}
                </p>
                <p className="hidden sm:block text-[11px] text-foreground/50 leading-snug mt-2 line-clamp-2 overflow-hidden max-w-[200px] min-h-[2.5rem]">
                  {avatar.description}
                </p>
                <div className="mt-auto pt-3 flex flex-col items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-full">
                    <Coins className="w-3 h-3" />
                    {avatar.creditCost} {avatar.creditCost === 1 ? t('dashboard.creditSingular') : t('dashboard.creditPlural')}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/30 uppercase tracking-widest group-hover:text-secondary transition-colors">
                    {t('dashboard.startChat')}
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvatarShowcase;
