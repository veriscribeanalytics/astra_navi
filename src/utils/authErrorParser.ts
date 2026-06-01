export interface ParsedAuthError {
  code: string | null;
  message: string | null;
  error: string | null;
  field: string | null;
  action: string | null;
  retryAfterSeconds: number | null;
}

/**
 * Utility to parse backend API auth responses and extract structured error information.
 */
export function parseAuthError(err: unknown): ParsedAuthError {
  if (!err) {
    return {
      code: null,
      message: null,
      error: null,
      field: null,
      action: null,
      retryAfterSeconds: null,
    };
  }

  // If the error is a plain string, try to parse it as JSON first in case it's a stringified JSON object
  let parsedJson: Record<string, unknown> | null = null;
  if (typeof err === 'string') {
    try {
      parsedJson = JSON.parse(err) as Record<string, unknown>;
    } catch {
      // Not a JSON string
    }
  }

  const rawData = parsedJson || err;
  const data = typeof rawData === 'object' && rawData !== null ? (rawData as Record<string, unknown>) : {};

  // Extract error code
  let code: string | null = null;
  if (typeof data.code === 'string') {
    code = data.code;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).code === 'string') {
    code = (data.error as Record<string, unknown>).code as string;
  } else if (typeof data.error === 'string' && data.error.includes('_')) {
    // Sometimes error string itself might be a code (e.g., 'wrong_password')
    code = data.error;
  } else if (typeof data.detail === 'string' && data.detail.includes('_')) {
    code = data.detail;
  } else if (data.detail && typeof data.detail === 'object' && typeof (data.detail as Record<string, unknown>).code === 'string') {
    code = (data.detail as Record<string, unknown>).code as string;
  }

  // Extract message
  let message: string | null = null;
  if (typeof data.message === 'string') {
    message = data.message;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).message === 'string') {
    message = (data.error as Record<string, unknown>).message as string;
  } else if (typeof data.detail === 'string') {
    message = data.detail;
  } else if (data.detail && typeof data.detail === 'object' && typeof (data.detail as Record<string, unknown>).message === 'string') {
    message = (data.detail as Record<string, unknown>).message as string;
  }

  // Extract error
  let errorVal: string | null = null;
  if (typeof data.error === 'string') {
    errorVal = data.error;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).error === 'string') {
    errorVal = (data.error as Record<string, unknown>).error as string;
  }

  // Extract field
  let field: string | null = null;
  if (typeof data.field === 'string') {
    field = data.field;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).field === 'string') {
    field = (data.error as Record<string, unknown>).field as string;
  } else if (data.detail && typeof data.detail === 'object' && typeof (data.detail as Record<string, unknown>).field === 'string') {
    field = (data.detail as Record<string, unknown>).field as string;
  }

  // Extract action
  let action: string | null = null;
  if (typeof data.action === 'string') {
    action = data.action;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).action === 'string') {
    action = (data.error as Record<string, unknown>).action as string;
  } else if (data.detail && typeof data.detail === 'object' && typeof (data.detail as Record<string, unknown>).action === 'string') {
    action = (data.detail as Record<string, unknown>).action as string;
  }

  // Extract retryAfterSeconds
  let retryAfterSeconds: number | null = null;
  if (typeof data.retryAfterSeconds === 'number') {
    retryAfterSeconds = data.retryAfterSeconds;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).retryAfterSeconds === 'number') {
    retryAfterSeconds = (data.error as Record<string, unknown>).retryAfterSeconds as number;
  } else if (data.detail && typeof data.detail === 'object' && typeof (data.detail as Record<string, unknown>).retryAfterSeconds === 'number') {
    retryAfterSeconds = (data.detail as Record<string, unknown>).retryAfterSeconds as number;
  } else if (typeof data.retry_after === 'number') {
    retryAfterSeconds = data.retry_after;
  } else if (data.error && typeof data.error === 'object' && typeof (data.error as Record<string, unknown>).retry_after === 'number') {
    retryAfterSeconds = (data.error as Record<string, unknown>).retry_after as number;
  }

  return {
    code,
    message,
    error: errorVal,
    field,
    action,
    retryAfterSeconds,
  };
}

/**
 * Returns the localized message for the parsed error using standard fallback rules.
 * Fallback order: localized code message -> error.message -> error.error -> generic localized error.
 * Also interpolates retry countdown if present.
 */
export function getLocalizedErrorMessage(
  parsed: ParsedAuthError,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, vars?: any) => string
): string {
  // 1. Try localized code message
  if (parsed.code) {
    const key = `auth.errors.${parsed.code}`;
    const localized = t(key);
    if (localized && localized !== key) {
      return localized;
    }
  }

  // 2. Fall back to error.message
  if (parsed.message) {
    return parsed.message;
  }

  // 3. Fall back to error.error
  if (parsed.error) {
    return parsed.error;
  }

  // 4. Fall back to generic localized error
  return t('auth.errors.generic');
}
