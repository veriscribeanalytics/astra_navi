'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader2, Square, X } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { isSpeechSupported } from '@/hooks/useVoiceSettings';
import type { ConversationMode as ConversationModeState } from '@/hooks/useConversationMode';

interface ConversationModeProps {
  conversation: ConversationModeState;
}

const ConversationModeBar: React.FC<ConversationModeProps> = ({ conversation }) => {
  const { t } = useTranslation();
  const { phase, partialTranscript, micSupported, toggleMic, deactivate } = conversation;

  const ttsSupported = isSpeechSupported();
  const supported = micSupported && ttsSupported;

  const statusLabel = () => {
    if (!supported) return t('chat.conversation.notSupported');
    if (!micSupported) return t('chat.conversation.micError');
    switch (phase) {
      case 'listening': return t('chat.conversation.listening');
      case 'processing': return t('chat.conversation.thinking');
      case 'speaking': return t('chat.conversation.speaking');
      default: return t('chat.conversation.tapToSpeak');
    }
  };

  const hintLabel = () => {
    switch (phase) {
      case 'listening': return t('chat.conversation.tapToStop');
      case 'speaking': return t('chat.conversation.talkToInterrupt');
      case 'processing': return t('chat.conversation.talkToInterrupt');
      default: return '';
    }
  };

  const isListening = phase === 'listening';
  const isBusy = phase === 'processing';
  const isSpeaking = phase === 'speaking';

  return (
    <div className="w-full px-2 sm:px-5 3xl:px-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-4 relative z-20 shrink-0">
      <div className="chat-input-container relative flex flex-col items-center gap-2 overflow-hidden transition-all">
        {/* Exit button */}
        <button
          type="button"
          onClick={deactivate}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-surface-variant/30 transition-colors z-10"
          aria-label={t('chat.conversation.exit')}
          title={t('chat.conversation.exit')}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Partial transcript (live) */}
        <div className="w-full min-h-[20px] px-4 pt-2 text-center">
          <AnimatePresence mode="wait">
            {isListening && partialTranscript ? (
              <motion.p
                key="transcript"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[14px] text-foreground/70 italic leading-snug line-clamp-2"
              >
                “{partialTranscript}”
              </motion.p>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <span className={`text-[13px] sm:text-[14px] font-semibold ${
                  isSpeaking ? 'text-secondary' : isListening ? 'text-red-500' : 'text-foreground/60'
                }`}>
                  {statusLabel()}
                </span>
                {hintLabel() && (
                  <span className="text-[11px] text-foreground/35">{hintLabel()}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mic button */}
        <div className="flex items-center justify-center pb-3 pt-1">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!supported}
            aria-label={statusLabel()}
            className={`relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center shrink-0 transition-all ${
              !supported
                ? 'bg-surface-variant/40 text-foreground/30 cursor-not-allowed'
                : isListening
                ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30 scale-105'
                : isSpeaking
                ? 'bg-secondary/15 text-secondary border-2 border-secondary/40'
                : isBusy
                ? 'bg-surface-variant/50 text-foreground/50'
                : 'gold-gradient text-on-primary shadow-lg shadow-secondary/25 hover:scale-105 active:scale-95'
            }`}
          >
            {/* Pulse ring while listening */}
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-500/60"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            {!supported ? (
              <MicOff className="w-6 h-6" />
            ) : isBusy ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isSpeaking ? (
              <span className="flex items-end gap-[3px] h-6">
                {[0, 1, 2, 3].map(i => (
                  <motion.span
                    key={i}
                    className="w-[3px] rounded-full bg-current"
                    animate={{ height: ['35%', '100%', '35%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
                    style={{ height: '35%' }}
                  />
                ))}
              </span>
            ) : isListening ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationModeBar;
