'use client';

import { clientFetch } from '@/lib/apiClient';

/**
 * Cloud text-to-speech playback.
 *
 * Fetches MP3 audio from the same-origin `/api/voice/tts` proxy (which injects
 * the backend key server-side) and plays it through an <audio> element. Works on
 * every platform including iOS Safari, where MP3 playback is universal (only the
 * mic-capture side needs an iOS fallback).
 *
 * Returns a handle immediately; playback starts asynchronously. Call `.stop()`
 * to cancel fetch and/or halt playback. `onEnd` fires exactly once — on natural
 * end, error, or stop — so callers can always clear their "speaking" state.
 */

export interface SpeakHandle {
  stop: () => void;
}

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  /** Called on failure so the caller can fall back (e.g. to speechSynthesis). */
  onError?: (err: unknown) => void;
  /** Playback rate; matches the prior speechSynthesis default of 0.95. */
  rate?: number;
}

export function speakViaCloud(text: string, lang: string, opts: SpeakOptions = {}): SpeakHandle {
  const { onStart, onEnd, onError, rate = 0.95 } = opts;

  let cancelled = false;
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let ended = false;
  const controller = new AbortController();

  const cleanup = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio = null;
    }
  };

  // Fire onEnd exactly once across all termination paths.
  const finish = () => {
    if (ended) return;
    ended = true;
    cleanup();
    onEnd?.();
  };

  const fail = (err: unknown) => {
    if (ended) return;
    ended = true;
    cleanup();
    onError?.(err);
    // onError owns the fallback; do NOT also call onEnd here, or the caller
    // would clear "speaking" state that the fallback path is about to set.
  };

  (async () => {
    try {
      const res = await clientFetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
        signal: controller.signal,
      });

      if (cancelled) return;
      if (!res.ok) {
        fail(new Error(`TTS request failed: ${res.status}`));
        return;
      }

      const blob = await res.blob();
      if (cancelled) return;

      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      audio.playbackRate = rate;
      audio.onended = finish;
      audio.onerror = () => fail(new Error('Audio playback error'));

      onStart?.();
      await audio.play();
    } catch (err) {
      if (cancelled) return;
      // AbortError from an intentional stop() is not a real failure.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      fail(err);
    }
  })();

  return {
    stop: () => {
      if (cancelled) return;
      cancelled = true;
      controller.abort();
      if (audio) {
        try { audio.pause(); } catch { /* noop */ }
      }
      finish();
    },
  };
}
