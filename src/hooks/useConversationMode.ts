'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage } from '@/context/ChatContext';
import { useTranslation } from './useTranslation';
import { useVoiceSettings, isSpeechSupported, loadSpeechVoices, resolveLangAndVoiceForText } from './useVoiceSettings';
import { cleanTextForSpeech } from '@/utils/markdownParser';
import { speakViaCloud, type SpeakHandle } from '@/utils/cloudTts';
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
  const { sendMessage, createNewChat, isSending, activeChat, activeChatId, paywall, isGuest } = useChat();
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
  const committedIdxRef = useRef(0);
  const awaitingResponseRef = useRef(false);
  const pendingInterruptRef = useRef(false);
  const prevSendingRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const speakingTextRef = useRef('');
  const activeChatRef = useRef(activeChat);
  const prevAiIdRef = useRef<string | null>(null);
  const blockedRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsKeepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cloudTtsHandleRef = useRef<SpeakHandle | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { blockedRef.current = !!paywall || isGuest; }, [paywall, isGuest]);

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

  const clearTtsTimers = useCallback(() => {
    if (ttsWatchdogRef.current) { clearTimeout(ttsWatchdogRef.current); ttsWatchdogRef.current = null; }
    if (ttsKeepaliveRef.current) { clearInterval(ttsKeepaliveRef.current); ttsKeepaliveRef.current = null; }
  }, []);

  // Halt any in-flight speech from either engine (cloud <audio> or browser TTS).
  const stopAllSpeech = useCallback(() => {
    if (cloudTtsHandleRef.current) { cloudTtsHandleRef.current.stop(); cloudTtsHandleRef.current = null; }
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    clearTtsTimers();
  }, [clearTtsTimers]);

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
      // Baseline the latest AI message so the response watcher only speaks a
      // genuinely new reply (not a stale one left by a blocked/errored send).
      const msgs = activeChatRef.current?.messages ?? [];
      prevAiIdRef.current = [...msgs].reverse().find(m => m.type === 'ai')?.id ?? null;
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
      // Drop out of 'speaking' BEFORE stopping speech so a synchronous cloud
      // onEnd from .stop() is a no-op rather than restarting listening.
      setPhaseSync('idle');
      stopAllSpeech();
      clearCommitTimer();
      clearSilenceTimer();
      finalTranscriptRef.current = '';
      setPartialTranscript('');
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
      setPhaseSync('listening');
      stopAllSpeech();
      pendingInterruptRef.current = false;
      finalTranscriptRef.current = '';
      setPartialTranscript('');
      armSilenceTimer();
      ensureRunningRef.current();
    };
  });

  useEffect(() => {
    commitSendRef.current = () => {
      // Only the listening phase may commit. The commit timer and the onend
      // fallback both call this; once the first transitions us out of listening,
      // a second call is a no-op rather than a spurious goIdle mid-processing.
      if (phaseRef.current !== 'listening') return;
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
      const textToSpeak = [msg.opener, msg.text].filter(Boolean).join('\n\n');
      const clean = cleanTextForSpeech(textToSpeak);
      speakingTextRef.current = clean;
      if (!clean) {
        startListeningRef.current();
        return;
      }
      stopAllSpeech();
      setPhaseSync('speaking');
      ensureRunningRef.current(); // keep recognition live for voice barge-in

      // Resume listening once speech finishes naturally. If the user barged
      // in (voice/tap), phase is no longer 'speaking' by the time this fires,
      // so the no-op guard prevents a spurious listen restart.
      const finish = () => {
        clearTtsTimers();
        if (phaseRef.current === 'speaking') {
          startListeningRef.current();
        }
      };

      // Browser fallback for when cloud TTS (backend MP3) is unreachable. The
      // keepalive/watchdog only apply here — Chrome's ~15s utterance-pause bug
      // does not affect the cloud <audio> path.
      const speakViaBrowser = async () => {
        if (!isSpeechSupported()) { finish(); return; }
        await loadSpeechVoices();
        if (phaseRef.current !== 'speaking') return; // user interrupted while voices loaded
        let availableVoices = voices;
        if (!availableVoices.length) {
          availableVoices = await loadSpeechVoices();
        }
        if (phaseRef.current !== 'speaking') return;
        const { langCode: detectedLangCode, voice } = resolveLangAndVoiceForText(clean, langCode, availableVoices, selectedVoiceURI);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = detectedLangCode;
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.cancel();
        ttsKeepaliveRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
          else clearTtsTimers();
        }, 10000);
        const watchdogMs = Math.max(15000, clean.length * 90);
        ttsWatchdogRef.current = setTimeout(finish, watchdogMs);
        window.speechSynthesis.speak(utterance);
      };

      const { langCode: detectedLangCode } = resolveLangAndVoiceForText(clean, langCode, voices, selectedVoiceURI);
      cloudTtsHandleRef.current = speakViaCloud(clean, detectedLangCode, {
        onEnd: () => { cloudTtsHandleRef.current = null; finish(); },
        onError: () => { cloudTtsHandleRef.current = null; void speakViaBrowser(); },
      });
    };
  });

  // Create / recreate the speech recognition instance when language changes.
  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicSupported(false);
      return;
    }
    committedIdxRef.current = 0;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      // Mobile browsers re-emit the full results array with resultIndex = 0,
      // which duplicates already-final transcripts if we rely on
      // event.resultIndex. Track the last committed final index ourselves.
      for (let i = committedIdxRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
          committedIdxRef.current = i + 1;
        } else {
          // Mobile Chrome pushes each growing interim snapshot as a NEW array
          // entry instead of updating in place; accumulating (+=) would repeat
          // every stale prefix. The trailing interim is the most complete
          // snapshot of the current utterance, so replace rather than append.
          interimText = result[0].transcript;
        }
      }

      const anySpeech = (finalText + interimText).trim().length > 0;
      if (anySpeech && phaseRef.current === 'listening') {
        restartAttemptsRef.current = 0; // healthy session — reset restart backoff
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
        return;
      }
      // Persistent recoverable errors (network, audio-capture) would otherwise
      // let onend hammer start() in a tight loop. Count them so the backoff in
      // onend can grow the retry delay; a clean session resets the counter.
      if (event.error === 'network' || event.error === 'audio-capture') {
        restartAttemptsRef.current += 1;
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      committedIdxRef.current = 0;
      if (!isActiveRef.current) return;
      if (phaseRef.current === 'idle') return;
      // Fallback commit if the browser emitted finals then stopped before our
      // commit timer fired.
      if (phaseRef.current === 'listening' && finalTranscriptRef.current.trim()) {
        commitSendRef.current();
        return;
      }
      // Restart to keep monitoring (barge-in during processing/speaking, or
      // continued listening). Back off on repeated failures so a persistent
      // error (e.g. no network) doesn't spin start() at full speed. Give up
      // after several attempts and return to idle.
      const attempts = restartAttemptsRef.current;
      if (attempts >= 5) {
        restartAttemptsRef.current = 0;
        goIdleRef.current();
        return;
      }
      const delay = Math.min(150 * 2 ** attempts, 4000);
      setTimeout(() => ensureRunningRef.current(), delay);
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
        // Blocked send (paywall/guest): don't speak the block notice and don't
        // reopen the mic into a wall — return to idle and let the UI surface it.
        if (blockedRef.current) {
          goIdleRef.current();
          return;
        }
        const msgs = activeChatRef.current?.messages ?? [];
        const lastAi = [...msgs].reverse().find(m => m.type === 'ai');
        if (lastAi && lastAi.id !== prevAiIdRef.current && lastAi.text && !lastAi.error) {
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
    committedIdxRef.current = 0;
    setPartialTranscript('');
    // Auto-start listening so the user can speak right away.
    setTimeout(() => startListeningRef.current(), 120);
  }, [setPhaseSync]);

  const deactivate = useCallback(() => {
    if (recognitionRunningRef.current) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    }
    stopAllSpeech();
    clearCommitTimer();
    clearSilenceTimer();
    finalTranscriptRef.current = '';
    committedIdxRef.current = 0;
    awaitingResponseRef.current = false;
    pendingInterruptRef.current = false;
    restartAttemptsRef.current = 0;
    setPartialTranscript('');
    setPhaseSync('idle');
    setIsActive(false);
  }, [setPhaseSync, stopAllSpeech, clearCommitTimer, clearSilenceTimer]);

  // Tear down TTS / recognition when the component unmounts.
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      if (cloudTtsHandleRef.current) { cloudTtsHandleRef.current.stop(); cloudTtsHandleRef.current = null; }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
      if (ttsKeepaliveRef.current) clearInterval(ttsKeepaliveRef.current);
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
