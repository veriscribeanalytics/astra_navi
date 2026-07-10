'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage } from '@/context/ChatContext';
import { useTranslation } from './useTranslation';
import { useVoiceSettings, isSpeechSupported, loadSpeechVoices, resolveLangAndVoiceForText } from './useVoiceSettings';
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
  const { inputText, setInputText, isSending, activeChat } = useChat();
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
  const prevSendingRef = useRef(false);
  const activeChatRef = useRef(activeChat);
  const isListeningRef = useRef(false);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);

  const speakRef = useRef<(msg: ChatMessage) => void>(() => {});
  useEffect(() => {
    speakRef.current = async (msg: ChatMessage) => {
      if (!isSpeechSupported()) return;
      window.speechSynthesis.cancel();
      const textToSpeak = [msg.opener, msg.text].filter(Boolean).join('\n\n');
      const clean = cleanTextForSpeech(textToSpeak);
      if (!clean) return;
      const utterance = new SpeechSynthesisUtterance(clean);
      let availableVoices = voices;
      if (!availableVoices.length) {
        availableVoices = await loadSpeechVoices();
      }
      const { langCode: detectedLangCode, voice } = resolveLangAndVoiceForText(clean, langCode, availableVoices, selectedVoiceURI);
      utterance.lang = detectedLangCode;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    };
  }, [voices, langCode, selectedVoiceURI]);

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
          interimText += result[0].transcript;
        }
      }
      if (finalText) {
        dictatedTextRef.current = (dictatedTextRef.current ? dictatedTextRef.current + ' ' : '') + finalText;
      }
      if ((finalText + interimText).trim()) {
        dictatedRef.current = true;
      }
      lastInterimRef.current = interimText;
      setInputText(joinParts(baseTextRef.current, dictatedTextRef.current, interimText));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicSupported(false);
        if (isListeningRef.current) {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      committedIdxRef.current = 0;
      if (isListeningRef.current) {
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
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch { /* already stopped */ }
    };
  }, [language, setInputText]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setMicSupported(false);
      return;
    }
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    dictatedTextRef.current = '';
    lastInterimRef.current = '';
    baseTextRef.current = inputTextRef.current;
    committedIdxRef.current = 0;
    isListeningRef.current = true;
    setIsListening(true);
    try {
      recognition.lang = LOCALE_BY_LANGUAGE[language] || 'en-IN';
      recognition.start();
      recognitionRunningRef.current = true;
    } catch {
      recognitionRunningRef.current = false;
    }
  }, [language]);

  const stopListening = useCallback((): string => {
    if (!isListeningRef.current) return inputTextRef.current;
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRunningRef.current) {
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
  }, [setInputText]);

  const onManualInput = useCallback((value: string) => {
    dictatedRef.current = false;
    setInputText(value);
  }, [setInputText]);

  const prepareSend = useCallback(() => {
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    speakNextRef.current = dictatedRef.current;
    dictatedRef.current = false;
  }, []);

  const stopSpeaking = useCallback(() => {
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Watch the send lifecycle: when a response finishes, speak it if the user
  // dictated the message they just sent.
  useEffect(() => {
    const wasSending = prevSendingRef.current;
    prevSendingRef.current = isSending;
    if (wasSending && !isSending && speakNextRef.current) {
      speakNextRef.current = false;
      const msgs = activeChatRef.current?.messages ?? [];
      const lastAi = [...msgs].reverse().find(m => m.type === 'ai');
      if (lastAi && lastAi.text && !lastAi.error) {
        speakRef.current(lastAi);
      }
    }
  }, [isSending]);

  // Tear down TTS / recognition when the component unmounts.
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

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
