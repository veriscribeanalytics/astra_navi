'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage } from '@/context/ChatContext';
import { useTranslation } from './useTranslation';
import { useVoiceSettings, isSpeechSupported, loadSpeechVoices, resolveLangAndVoiceForText } from './useVoiceSettings';
import { useMicStream } from './useMicStream';
import { speakViaCloud, type SpeakHandle } from '@/utils/cloudTts';
import { cleanTextForSpeech } from '@/utils/markdownParser';
import { LOCALE_BY_LANGUAGE } from '@/locales';

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

function joinParts(...parts: string[]): string {
  const cleaned = parts.map(p => p.trim()).filter(Boolean);
  return cleaned.join(' ');
}

export interface DictationMode {
  isListening: boolean;
  isSpeaking: boolean;
  micSupported: boolean;
  startListening: () => void;
  stopListening: () => string;
  onManualInput: (value: string) => void;
  prepareSend: () => void;
  stopSpeaking: () => void;
}

export function useDictation(): DictationMode {
  const { inputText, setInputText, isSending, activeChat, paywall, isGuest } = useChat();
  const { language } = useTranslation();
  const { voices, selectedVoiceURI, langCode } = useVoiceSettings();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recognitionRunningRef = useRef(false);
  const dictatedTextRef = useRef('');
  const lastInterimRef = useRef('');
  const baseTextRef = useRef('');
  const committedIdxRef = useRef(0);
  const inputTextRef = useRef(inputText);
  const dictatedRef = useRef(false);
  const speakNextRef = useRef(false);
  const prevAiIdRef = useRef<string | null>(null);
  const prevSendingRef = useRef(false);
  const activeChatRef = useRef(activeChat);
  const isListeningRef = useRef(false);
  const blockedRef = useRef(false);
  const cloudTtsHandleRef = useRef<SpeakHandle | null>(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { blockedRef.current = !!paywall || isGuest; }, [paywall, isGuest]);
  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);

  const speakRef = useRef<(msg: ChatMessage) => void>(() => {});
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsKeepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTtsTimers = useCallback(() => {
    if (ttsWatchdogRef.current) { clearTimeout(ttsWatchdogRef.current); ttsWatchdogRef.current = null; }
    if (ttsKeepaliveRef.current) { clearInterval(ttsKeepaliveRef.current); ttsKeepaliveRef.current = null; }
  }, []);

  // Halt any in-flight speech from either engine (cloud <audio> or browser TTS).
  const stopAllSpeech = useCallback(() => {
    if (cloudTtsHandleRef.current) { cloudTtsHandleRef.current.stop(); cloudTtsHandleRef.current = null; }
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    clearTtsTimers();
    setIsSpeaking(false);
  }, [clearTtsTimers]);

  // Shared transcript sink used by BOTH engines. The browser SpeechRecognition
  // path emits final+interim together per event; the cloud WS emits them as
  // separate messages. Either way the composite input text is recomputed here.
  const applyTranscript = useCallback((interimText: string, finalText: string) => {
    if (!isListeningRef.current) return;
    if (finalText) {
      dictatedTextRef.current = (dictatedTextRef.current ? dictatedTextRef.current + ' ' : '') + finalText;
    }
    if ((finalText + interimText).trim()) {
      dictatedRef.current = true;
    }
    lastInterimRef.current = interimText;
    setInputText(joinParts(baseTextRef.current, dictatedTextRef.current, interimText));
  }, [setInputText]);

  // Commit whatever was captured and drop out of listening. Used by the browser
  // onend fallback and by the cloud stream's error/close callbacks.
  const finalizeListening = useCallback(() => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);
    const text = joinParts(baseTextRef.current, dictatedTextRef.current, lastInterimRef.current);
    if ((dictatedTextRef.current + lastInterimRef.current).trim()) {
      dictatedRef.current = true;
    }
    setInputText(text);
    dictatedTextRef.current = '';
    lastInterimRef.current = '';
    baseTextRef.current = '';
    committedIdxRef.current = 0;
  }, [setInputText]);

  // --- Cloud STT (WebSocket capture; works in Android WebView) ---
  const micStream = useMicStream({
    getLang: () => LOCALE_BY_LANGUAGE[language] || 'en-IN',
    onInterim: (t) => applyTranscript(t, ''),
    onFinal: (t) => applyTranscript('', t),
    onError: (code) => {
      // A hard mic-permission denial disables the button; other failures just
      // drop us out of listening (and commit whatever we captured).
      if (code === 'not-allowed') setMicSupported(false);
      finalizeListening();
    },
    onClose: () => finalizeListening(),
  });
  const { supported: cloudSupported, start: micStart, stop: micStop } = micStream;

  const cloudSupportedRef = useRef(false);
  useEffect(() => { cloudSupportedRef.current = cloudSupported; }, [cloudSupported]);

  // Mic button is available if EITHER engine can capture.
  useEffect(() => {
    const browserAvail = !!getSpeechRecognitionCtor();
    setMicSupported(cloudSupported || browserAvail);
  }, [cloudSupported]);

  // TTS: cloud MP3 first (consistent voices across all 11 languages, works on
  // every platform including iOS), with browser speechSynthesis as a fallback
  // when the network/synthesis fails.
  useEffect(() => {
    const speakViaBrowser = async (clean: string, detectedLangCode: string) => {
      if (!isSpeechSupported()) { setIsSpeaking(false); return; }
      clearTtsTimers();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      let availableVoices = voices;
      if (!availableVoices.length) {
        availableVoices = await loadSpeechVoices();
      }
      const { voice } = resolveLangAndVoiceForText(clean, langCode, availableVoices, selectedVoiceURI);
      utterance.lang = detectedLangCode;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      const finish = () => {
        clearTtsTimers();
        setIsSpeaking(false);
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      setIsSpeaking(true);
      // Chrome pauses long utterances (~15s) and never fires onend; resume()
      // on an interval keeps it going, and a duration-based watchdog force-clears
      // the speaking state if the engine drops the utterance silently.
      ttsKeepaliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
        else clearTtsTimers();
      }, 10000);
      const watchdogMs = Math.max(15000, clean.length * 90);
      ttsWatchdogRef.current = setTimeout(finish, watchdogMs);
      window.speechSynthesis.speak(utterance);
    };

    speakRef.current = (msg: ChatMessage) => {
      const textToSpeak = [msg.opener, msg.text].filter(Boolean).join('\n\n');
      const clean = cleanTextForSpeech(textToSpeak);
      if (!clean) return;
      // Detect the spoken language from the reply's own script (e.g. a Hindi
      // reply while the UI is English) to pick the right voice locale.
      const { langCode: detectedLangCode } = resolveLangAndVoiceForText(clean, langCode, voices, selectedVoiceURI);

      // Stop anything currently playing on either engine.
      if (cloudTtsHandleRef.current) { cloudTtsHandleRef.current.stop(); cloudTtsHandleRef.current = null; }
      clearTtsTimers();
      if (isSpeechSupported()) window.speechSynthesis.cancel();

      setIsSpeaking(true);
      cloudTtsHandleRef.current = speakViaCloud(clean, detectedLangCode, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => {
          cloudTtsHandleRef.current = null;
          void speakViaBrowser(clean, detectedLangCode);
        },
      });
    };
  }, [voices, langCode, selectedVoiceURI, clearTtsTimers]);

  // Create / recreate the browser speech recognition instance — ONLY when the
  // cloud path is unavailable (e.g. iOS Safari, which can't produce WEBM_OPUS).
  useEffect(() => {
    if (cloudSupported) return; // cloud WS handles capture
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return; // neither engine — micSupported effect already disabled the button
    committedIdxRef.current = 0;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isListeningRef.current) return;
      let finalText = '';
      let interimText = '';
      // Mobile browsers re-emit the full results array with resultIndex = 0,
      // so relying on event.resultIndex duplicates already-final transcripts.
      // Track the last committed final index ourselves and only append finals
      // we have not yet committed.
      for (let i = committedIdxRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
          committedIdxRef.current = i + 1;
        } else {
          // Mobile Chrome pushes each growing interim snapshot as a NEW array
          // entry instead of updating in place, so accumulating (+=) here
          // concatenates every stale prefix ("hello hello aapko hello aapko
          // kya ..."). The trailing interim is always the most complete
          // snapshot of the current utterance, so replace rather than append.
          interimText = result[0].transcript;
        }
      }
      applyTranscript(interimText, finalText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicSupported(false);
        if (isListeningRef.current) {
          isListeningRef.current = false;
          setIsListening(false);
        }
        return;
      }
      // Recoverable errors (no-speech, audio-capture, network, aborted): don't
      // disable the mic, but drop out of the listening state so onend finalizes
      // whatever was captured instead of leaving the button stuck red.
      if (isListeningRef.current && event.error !== 'no-speech') {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      committedIdxRef.current = 0;
      finalizeListening();
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    };
  }, [language, cloudSupported, applyTranscript, finalizeListening]);

  const startListening = useCallback(() => {
    stopAllSpeech();
    dictatedTextRef.current = '';
    lastInterimRef.current = '';
    baseTextRef.current = inputTextRef.current;
    committedIdxRef.current = 0;
    isListeningRef.current = true;
    setIsListening(true);

    if (cloudSupportedRef.current) {
      micStart().catch(() => {
        isListeningRef.current = false;
        setIsListening(false);
      });
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      setMicSupported(false);
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }
    try {
      recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-IN';
      recognition.start();
      recognitionRunningRef.current = true;
    } catch {
      recognitionRunningRef.current = false;
    }
  }, [language, stopAllSpeech, micStart]);

  const stopListening = useCallback((): string => {
    if (!isListeningRef.current) return inputTextRef.current;
    isListeningRef.current = false;
    setIsListening(false);
    if (cloudSupportedRef.current) {
      micStop();
    } else if (recognitionRunningRef.current) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    }
    const text = joinParts(baseTextRef.current, dictatedTextRef.current, lastInterimRef.current);
    if ((dictatedTextRef.current + lastInterimRef.current).trim()) {
      dictatedRef.current = true;
    }
    setInputText(text);
    dictatedTextRef.current = '';
    lastInterimRef.current = '';
    baseTextRef.current = '';
    committedIdxRef.current = 0;
    return text;
  }, [setInputText, micStop]);

  const onManualInput = useCallback((value: string) => {
    dictatedRef.current = false;
    setInputText(value);
  }, [setInputText]);

  const prepareSend = useCallback(() => {
    stopAllSpeech();
    speakNextRef.current = dictatedRef.current;
    // Baseline: the last AI message that exists *before* this send. Auto-speak
    // only fires for a reply newer than this, so a blocked send (paywall/guest/
    // error) that leaves the prior reply as the latest AI message isn't respoken.
    const msgs = activeChatRef.current?.messages ?? [];
    const lastAi = [...msgs].reverse().find(m => m.type === 'ai');
    prevAiIdRef.current = lastAi?.id ?? null;
    dictatedRef.current = false;
  }, [stopAllSpeech]);

  const stopSpeaking = useCallback(() => {
    stopAllSpeech();
  }, [stopAllSpeech]);

  // Watch the send lifecycle: when a response finishes, speak it if the user
  // dictated the message they just sent. Suppressed when the send was blocked
  // (paywall/guest) or when no genuinely new AI reply landed.
  useEffect(() => {
    const wasSending = prevSendingRef.current;
    prevSendingRef.current = isSending;
    if (wasSending && !isSending && speakNextRef.current) {
      speakNextRef.current = false;
      if (blockedRef.current) return;
      const msgs = activeChatRef.current?.messages ?? [];
      const lastAi = [...msgs].reverse().find(m => m.type === 'ai');
      if (lastAi && lastAi.id !== prevAiIdRef.current && lastAi.text && !lastAi.error) {
        speakRef.current(lastAi);
      }
    }
  }, [isSending]);

  // Tear down TTS / recognition when the component unmounts.
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearTtsTimers();
      if (cloudTtsHandleRef.current) { cloudTtsHandleRef.current.stop(); cloudTtsHandleRef.current = null; }
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, [clearTtsTimers]);

  return {
    isListening,
    isSpeaking,
    micSupported,
    startListening,
    stopListening,
    onManualInput,
    prepareSend,
    stopSpeaking,
  };
}
