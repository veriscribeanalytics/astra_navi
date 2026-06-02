/**
 * fetch() with a default client-side timeout.
 *
 * A backend that accepts the connection but never responds (stuck worker, slow
 * DB, partial outage) must not leave an auth form spinning forever. This wrapper
 * aborts after `timeoutMs` and throws a clear, displayable Error so the calling
 * form resolves its loading state and shows a recoverable message.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}
