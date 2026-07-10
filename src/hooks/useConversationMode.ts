'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage } from '@/context/ChatContext';
import { useTranslation } from './useTranslation';
import { useVoiceSettings, isSpeechSupported, loadSpeechVoices, resolveLangAndVoiceForText } from './useVoiceSettings';
import { LOCALE_BY_LANGUAGE } from '@/locales';

export type ConversationPhase = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ConversationMode {
  isActive: boolean;
  phase: ConversationPhase;
  partialTranscript: string;
  micSupported: boolean;
  activate: () => void;
  deactivate: () => void;
  toggleMic: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

const COMMIT_DELAY_MS = 1000;
const SILENCE_TIMEOUT_MS = 10000;
const BARGEIN_MIN_CHARS = 3;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function useConversationMode(): ConversationMode {
  const { sendMessage, createNewChat, isSending, activeChat, activeChatId } = useChat();
  const { language } = useTranslation();
  const { voices, selectedVoiceURI, langCode } = useVoiceSettings();

  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<ConversationPhase>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(true);

  const phaseRef = useRef<ConversationPhase>('idle');
  const isActiveRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionRunningRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const awaitingResponseRef = useRef(false);
  const pendingInterruptRef = useRef(false);
  const prevSendingRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const speakingTextRef = useRef('');
  const activeChatRef = useRef(activeChat);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const setPhaseSync = useCallback((p: ConversationPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const clearCommitTimer = useCallback(() => {
    if (commitTimerRef.current) { clearTimeout(commitTimerRef.current); commitTimerRef.current = null; }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  const sendRef = useRef<(text: string) => void>(() => {});
  const ensureRunningRef = useRef<() => void>(() => {});
  const goIdleRef = useRef<() => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});
  const bargeInRef = useRef<() => void>(() => {});
  const commitSendRef = useRef<() => void>(() => {});
  const speakRef = useRef<(msg: ChatMessage) => void>(() => {});

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    lastSpeechAtRef.current = Date.now();
    silenceTimerRef.current = setTimeout(() => {
      if (isActiveRef.current && phaseRef.current === 'listening') {
        goIdleRef.current();
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  useEffect(() => {
    sendRef.current = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (isSending) return;
      clearCommitTimer();
      clearSilenceTimer();
      setPhaseSync('processing');
      awaitingResponseRef.current = true;
      if (activeChatId) {
        sendMessage(trimmed);
      } else {
        createNewChat(trimmed);
      }
    };
  });

  useEffect(() => {
    ensureRunningRef.current = () => {
      const recognition = recognitionRef.current;
      if (!recognition || recognitionRunningRef.current) return;
      try {
        recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-US';
        recognition.start();
        recognitionRunningRef.current = true;
      } catch {
        // already started — ignore
      }
    };
  });

  useEffect(() => {
    goIdleRef.current = () => {
      clearCommitTimer();
      clearSilenceTimer();
      finalTranscriptRef.current = '';
      setPartialTranscript('');
      setPhaseSync('idle');
      if (recognitionRunningRef.current) {
        try { recognitionRef.current?.stop(); } catch { /* noop */ }
      }
    };
  });

  useEffect(() => {
    startListeningRef.current = () => {
      finalTranscriptRef.current = '';
      setPartialTranscript('');
      setPhaseSync('listening');
      armSilenceTimer();
      ensureRunningRef.current();
    };
  });

  useEffect(() => {
    bargeInRef.current = () => {
      if (isSpeechSupported()) window.speechSynthesis.cancel();
      pendingInterruptRef.current = false;
      finalTranscriptRef.current = '';
      setPartialTranscript('');
      setPhaseSync('listening');
      armSilenceTimer();
      ensureRunningRef.current();
    };
  });

  useEffect(() => {
    commitSendRef.current = () => {
      const text = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';
      setPartialTranscript('');
      clearCommitTimer();
      if (!text) {
        goIdleRef.current();
        return;
      }
      sendRef.current(text);
    };
  });

  useEffect(() => {
    speakRef.current = async (msg: ChatMessage) => {
      if (!isSpeechSupported()) {
        startListeningRef.current();
        return;
      }
      window.speechSynthesis.cancel();
      const textToSpeak = [msg.opener, msg.text].filter(Boolean).join('\n\n');
      const clean = textToSpeak.replace(/<[^>]*>/g, '').trim();
      speakingTextRef.current = clean;
      if (!clean) {
        startListeningRef.current();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(clean);
      await loadSpeechVoices();
      if (phaseRef.current !== 'processing') {
        // user interrupted (by voice or tap) while voices were loading
        if (phaseRef.current === 'idle') return;
        return;
      }
      let availableVoices = voices;
      if (!availableVoices.length) {
        availableVoices = await loadSpeechVoices();
      }
      const { langCode: detectedLangCode, voice } = resolveLangAndVoiceForText(clean, langCode, availableVoices, selectedVoiceURI);
      utterance.lang = detectedLangCode;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = () => {
        if (phaseRef.current === 'speaking') {
          startListeningRef.current(); // auto-listen after Navi finishes
        }
      };
      utterance.onerror = () => {
        if (phaseRef.current === 'speaking') {
          startListeningRef.current();
        }
      };
      setPhaseSync('speaking');
      ensureRunningRef.current(); // keep recognition live for voice barge-in
      window.speechSynthesis.speak(utterance);
    };
  });

  // Create / recreate the speech recognition instance when language changes.
  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }

      const anySpeech = (finalText + interimText).trim().length > 0;
      if (anySpeech && phaseRef.current === 'listening') {
        lastSpeechAtRef.current = Date.now();
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (isActiveRef.current && phaseRef.current === 'listening') {
            goIdleRef.current();
          }
        }, SILENCE_TIMEOUT_MS);
      }

      const currentPhase = phaseRef.current;

      // Barge-in by voice while Navi is speaking: detect real user speech and
      // ignore TTS echo (recognition of the AI's own audio on speakers) by
      // matching the interim transcript against the text being spoken.
      if (currentPhase === 'speaking') {
        const interimClean = normalize(interimText);
        if (interimClean.length >= BARGEIN_MIN_CHARS) {
          const aiClean = normalize(speakingTextRef.current);
          const isEcho = aiClean.length > 0 && aiClean.includes(interimClean);
          if (!isEcho) {
            bargeInRef.current();
          }
        }
      }

      // Barge-in by voice while Navi is thinking: queue listening after the
      // response lands. No echo possible here (TTS not playing).
      if (currentPhase === 'processing') {
        const interimClean = normalize(interimText);
        if (interimClean.length >= BARGEIN_MIN_CHARS) {
          pendingInterruptRef.current = true;
        }
      }

      // Only accumulate final results while listening (so TTS echo during
      // speaking never pollutes the user's message).
      if (finalText && phaseRef.current === 'listening') {
        finalTranscriptRef.current = (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') + finalText;
      }

      if (phaseRef.current === 'listening') {
        setPartialTranscript((finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') + interimText);
        // Commit after a natural pause following a complete utterance.
        if (finalText) {
          clearCommitTimer();
          commitTimerRef.current = setTimeout(() => {
            if (phaseRef.current === 'listening') commitSendRef.current();
          }, COMMIT_DELAY_MS);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicSupported(false);
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      if (!isActiveRef.current) return;
      if (phaseRef.current === 'idle') return;
      // Fallback commit if the browser emitted finals then stopped before our
      // commit timer fired.
      if (phaseRef.current === 'listening' && finalTranscriptRef.current.trim()) {
        commitSendRef.current();
        return;
      }
      // Restart to keep monitoring (barge-in during processing/speaking, or
      // continued listening).
      setTimeout(() => ensureRunningRef.current(), 150);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, [language, clearCommitTimer, clearSilenceTimer]);

  // Phase-driven recognition lifecycle: run in every phase except idle.
  useEffect(() => {
    if (!isActive) return;
    if (phase === 'idle') {
      clearCommitTimer();
      clearSilenceTimer();
      if (recognitionRunningRef.current) {
        try { recognitionRef.current?.stop(); } catch { /* noop */ }
      }
    } else {
      ensureRunningRef.current();
      if (phase !== 'listening') {
        clearCommitTimer();
        clearSilenceTimer();
      }
    }
  }, [phase, isActive, clearCommitTimer, clearSilenceTimer]);

  // Watch the send lifecycle: when a response finishes, speak it (or honor a
  // voice/tap barge-in that queued a listen).
  useEffect(() => {
    if (!isActive) {
      prevSendingRef.current = false;
      return;
    }
    const wasSending = prevSendingRef.current;
    prevSendingRef.current = isSending;

    if (wasSending && !isSending) {
      if (pendingInterruptRef.current) {
        pendingInterruptRef.current = false;
        awaitingResponseRef.current = false;
        startListeningRef.current();
        return;
      }
      if (phaseRef.current === 'listening') {
        awaitingResponseRef.current = false;
        return;
      }
      if (awaitingResponseRef.current) {
        awaitingResponseRef.current = false;
        const msgs = activeChatRef.current?.messages ?? [];
        const lastAi = [...msgs].reverse().find(m => m.type === 'ai');
        if (lastAi && lastAi.text && !lastAi.error) {
          speakRef.current(lastAi);
        } else {
          startListeningRef.current();
        }
      }
    }
  }, [isSending, isActive]);

  const toggleMic = useCallback(() => {
    if (!isActive || !micSupported) return;
    const current = phaseRef.current;
    if (current === 'listening') {
      goIdleRef.current(); // tap to cancel/discard
    } else if (current === 'speaking') {
      bargeInRef.current();
    } else if (current === 'processing') {
      pendingInterruptRef.current = true;
    } else {
      startListeningRef.current();
    }
  }, [isActive, micSupported]);

  const activate = useCallback(() => {
    setIsActive(true);
    setPhaseSync('idle');
    awaitingResponseRef.current = false;
    pendingInterruptRef.current = false;
    finalTranscriptRef.current = '';
    setPartialTranscript('');
    // Auto-start listening so the user can speak right away.
    setTimeout(() => startListeningRef.current(), 120);
  }, [setPhaseSync]);

  const deactivate = useCallback(() => {
    if (recognitionRunningRef.current) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    }
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    clearCommitTimer();
    clearSilenceTimer();
    finalTranscriptRef.current = '';
    awaitingResponseRef.current = false;
    pendingInterruptRef.current = false;
    setPartialTranscript('');
    setPhaseSync('idle');
    setIsActive(false);
  }, [setPhaseSync, clearCommitTimer, clearSilenceTimer]);

  // Tear down TTS / recognition when the component unmounts.
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    isActive,
    phase,
    partialTranscript,
    micSupported,
    activate,
    deactivate,
    toggleMic,
  };
}
