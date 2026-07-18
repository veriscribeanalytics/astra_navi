import 'server-only';

/**
 * AstraMitra Backend API Client
 * 
 * Thin wrapper for fetch that handles service authentication 
 * when calling the FastAPI backend.
 */

if (typeof window !== 'undefined') {
  throw new Error('backendClient can only be used on the server.');
}

const BACKEND_URL = process.env.AI_BACKEND_URL;
const API_KEY = process.env.AI_BACKEND_API_KEY || '';

// Default upper bound for a backend round-trip. A backend that accepts the
// connection but never responds (stuck worker, slow DB) must not hang the BFF
// route — and therefore the user's spinner — indefinitely.
const DEFAULT_BACKEND_TIMEOUT_MS = 20_000;

export type BackendRequestOptions = RequestInit & {
  userEmail?: string;
  accessToken?: string;
  /** Override the default request timeout (ms). Pass 0 to disable. */
  timeoutMs?: number;
};

export async function backendFetch(
  path: string,
  options: BackendRequestOptions = {}
) {
  const { userEmail, accessToken, headers: extraHeaders, timeoutMs, signal, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...(userEmail ? { 'X-User-Email': userEmail } : {}),
    ...(extraHeaders as Record<string, string> || {}),
  };

  const url = `${BACKEND_URL}${path}`;

  // Honour a caller-supplied signal; otherwise apply a default timeout so the
  // promise always settles. When both exist we still fall back to the timeout.
  const effectiveTimeout = timeoutMs ?? DEFAULT_BACKEND_TIMEOUT_MS;
  const requestSignal = signal ?? (effectiveTimeout > 0 ? AbortSignal.timeout(effectiveTimeout) : undefined);

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      signal: requestSignal,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(`[backendFetch] Timeout after ${effectiveTimeout}ms calling ${url}`);
    } else {
      console.error(`[backendFetch] Error calling ${url}:`, error);
    }
    throw error;
  }
}
