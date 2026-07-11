'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';

/**
 * Cloud speech-to-text capture over a WebSocket.
 *
 * Captures mic audio with getUserMedia + MediaRecorder (WEBM_OPUS) and streams
 * it to the backend `WS /api/voice/stt`, emitting the same {interim, final}
 * transcript shape the browser SpeechRecognition path produces — so the calling
 * hook's state machine is unchanged.
 *
 * Unlike the browser SpeechRecognition API, MediaRecorder/getUserMedia work
 * inside an Android WebView, which is why this path is used for the production /
 * Android build. iOS Safari can't produce WEBM_OPUS, so `supported` is false
 * there and the caller falls back to browser SpeechRecognition.
 *
 * Auth: a short-lived, voice-scoped token is minted from the same-origin
 * `/api/voice/token` proxy right before opening the socket. The socket carries
 * only that scoped token — never the full access token or the backend API key.
 */

const WS_BASE = process.env.NEXT_PUBLIC_VOICE_WS_URL;
const MIME = 'audio/webm;codecs=opus';
const CHUNK_MS = 250;
const MAX_RECONNECT = 3;

export interface UseMicStreamOptions {
  /** Returns the BCP-47 locale for the session (e.g. "hi-IN"). */
  getLang: () => string;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  /** code is e.g. "not-allowed", "unauthorized", "network". */
  onError: (code: string) => void;
  /** Fired when the stream ends and cannot recover (gave up reconnecting). */
  onClose?: () => void;
}

export interface MicStream {
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

function computeSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!WS_BASE) return false;
  if (typeof MediaRecorder === 'undefined') return false;
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    return MediaRecorder.isTypeSupported(MIME);
  } catch {
    return false;
  }
}

export function useMicStream(options: UseMicStreamOptions): MicStream {
  // Keep the latest callbacks in a ref so start/stop stay stable and always
  // invoke current handlers.
  const optsRef = useRef(options);
  useEffect(() => { optsRef.current = options; }, [options]);

  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(computeSupported()); }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const reconnectRef = useRef(0);
  // Lets the reconnect timer call the latest openSession without a declaration
  // cycle (openSession references itself for reconnects).
  const openSessionRef = useRef<() => Promise<void>>(async () => {});

  const teardownSocket = useCallback(() => {
    const rec = recorderRef.current;
    if (rec) {
      rec.ondataavailable = null;
      try { if (rec.state !== 'inactive') rec.stop(); } catch { /* noop */ }
      recorderRef.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try { ws.close(); } catch { /* noop */ }
      wsRef.current = null;
    }
  }, []);

  const releaseMic = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
      streamRef.current = null;
    }
  }, []);

  // Opens one WS session: mint token -> connect -> start frame -> stream mic.
  // Reused for reconnects. The mic MediaStream is reused across reconnects, but
  // a fresh MediaRecorder is created each time so a new WEBM header is emitted
  // for the new socket (Google can't decode a headerless mid-stream fragment).
  const openSession = useCallback(async () => {
    if (!WS_BASE) { optsRef.current.onError('unsupported'); return; }

    // 1. Mint a short-lived voice-scoped token.
    let token: string;
    try {
      const res = await clientFetch('/api/voice/token', { method: 'POST' });
      if (!res.ok) { optsRef.current.onError('unauthorized'); return; }
      const data = await res.json();
      token = data.token;
      if (!token) { optsRef.current.onError('unauthorized'); return; }
    } catch {
      optsRef.current.onError('network');
      return;
    }
    if (!listeningRef.current) return; // stopped while minting

    // 2. Acquire the mic (reuse across reconnects to avoid re-prompting).
    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        optsRef.current.onError('not-allowed');
        listeningRef.current = false;
        return;
      }
    }
    if (!listeningRef.current) { releaseMic(); return; }

    // 3. Open the socket.
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${WS_BASE}/api/voice/stt`);
    } catch {
      optsRef.current.onError('network');
      return;
    }
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      if (!listeningRef.current) { try { ws.close(); } catch { /* noop */ } return; }
      ws.send(JSON.stringify({
        type: 'start',
        token,
        lang: optsRef.current.getLang(),
        sampleRate: 48000,
      }));

      const stream = streamRef.current;
      if (!stream) return;
      const rec = new MediaRecorder(stream, { mimeType: MIME });
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };
      try {
        rec.start(CHUNK_MS);
      } catch {
        optsRef.current.onError('network');
      }
    };

    ws.onmessage = (ev) => {
      let msg: { type?: string; text?: string };
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
      } catch {
        return;
      }
      // TEMP DIAGNOSTIC — remove after the transcript-drop bug is fixed.
      // Shows every raw STT message so we can see whether `final` events fire.
      console.log('[voice-stt]', msg.type, JSON.stringify(msg.text));
      if (msg.type === 'interim') optsRef.current.onInterim(msg.text ?? '');
      else if (msg.type === 'final') optsRef.current.onFinal(msg.text ?? '');
      else if (msg.type === 'error') {
        // A server-side error (e.g. unauthorized) is terminal for this session.
        manualStopRef.current = true;
        optsRef.current.onError(msg.text || 'error');
      }
    };

    ws.onerror = () => { /* surfaced via onclose */ };

    ws.onclose = () => {
      // Detach the dead recorder; keep the mic for a possible reconnect.
      const rec = recorderRef.current;
      if (rec) {
        rec.ondataavailable = null;
        try { if (rec.state !== 'inactive') rec.stop(); } catch { /* noop */ }
        recorderRef.current = null;
      }
      wsRef.current = null;

      if (manualStopRef.current || !listeningRef.current) return;

      // Unexpected drop while still listening — reconnect with backoff.
      if (reconnectRef.current >= MAX_RECONNECT) {
        listeningRef.current = false;
        reconnectRef.current = 0;
        releaseMic();
        optsRef.current.onClose?.();
        return;
      }
      const attempt = reconnectRef.current++;
      const delay = Math.min(300 * 2 ** attempt, 3000);
      setTimeout(() => {
        if (listeningRef.current && !manualStopRef.current) openSessionRef.current();
      }, delay);
    };
  }, [releaseMic]);

  useEffect(() => { openSessionRef.current = openSession; }, [openSession]);

  const start = useCallback(async () => {
    if (listeningRef.current) return;
    manualStopRef.current = false;
    reconnectRef.current = 0;
    listeningRef.current = true;
    await openSession();
  }, [openSession]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    listeningRef.current = false;
    reconnectRef.current = 0;
    // Tell the server to flush before we tear down, if the socket is open.
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'stop' })); } catch { /* noop */ }
    }
    teardownSocket();
    releaseMic();
  }, [teardownSocket, releaseMic]);

  // Teardown on unmount.
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      listeningRef.current = false;
      teardownSocket();
      releaseMic();
    };
  }, [teardownSocket, releaseMic]);

  return { supported, start, stop };
}
