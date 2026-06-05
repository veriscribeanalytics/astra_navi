import type { PaywallData, PaywallFeatureKey } from '@/types/paywall';
import { FAMILY_INVITE_ERROR_CODES } from '@/types/family';

export enum ApiErrorCategory {
  auth = 'auth',
  paywall = 'paywall',
  capacity = 'capacity',
  validation = 'validation',
  admin = 'admin',
  payment = 'payment',
  rateLimit = 'rateLimit',
  reservation = 'reservation',
  family = 'family',
  client = 'client',
  server = 'server',
  network = 'network',
}

export const AUTH_ACTIONS = {
  retry: 'retry',
  register: 'register',
  login: 'login',
  reset_password: 'reset_password',
  request_password_reset: 'request_password_reset',
  logout: 'logout',
} as const;
export type AuthAction = (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS];

export const API_ERROR_CODES = {
  token_expired: 'token_expired',
  token_invalid: 'token_invalid',
  unauthorized: 'unauthorized',
  user_not_found: 'user_not_found',
  rate_limited: 'rate_limited',
  email_required: 'email_required',
  email_invalid: 'email_invalid',
  email_too_long: 'email_too_long',
  password_required: 'password_required',
  password_too_short: 'password_too_short',
  password_too_long: 'password_too_long',
  password_weak: 'password_weak',
  paywall_blocked: 'paywall_blocked',
  reservation_pending: 'reservation_pending',
  FAMILY_FREE_TIER_CAP: 'FAMILY_FREE_TIER_CAP',
  SHARING_REQUIRED: 'SHARING_REQUIRED',
  INVITE_BLOCKED: 'INVITE_BLOCKED',
  INVITEE_NO_ACCOUNT: 'INVITEE_NO_ACCOUNT',
  ALREADY_CONNECTED: 'ALREADY_CONNECTED',
  INVITE_PENDING: 'INVITE_PENDING',
  DECLINE_COOLDOWN_ACTIVE: 'DECLINE_COOLDOWN_ACTIVE',
  INVITE_NOT_PENDING: 'INVITE_NOT_PENDING',
  INVITE_REQUESTER_MISSING: 'INVITE_REQUESTER_MISSING',
  MERGE_REQUESTER_MISSING: 'MERGE_REQUESTER_MISSING',
  MERGE_CANDIDATE_MISMATCH: 'MERGE_CANDIDATE_MISMATCH',
  BLOCK_TARGET_NOT_FOUND: 'BLOCK_TARGET_NOT_FOUND',
  CANNOT_BLOCK_SELF: 'CANNOT_BLOCK_SELF',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  export_rate_limited: 'export_rate_limited',
  payments_unconfigured: 'payments_unconfigured',
  gateway_error: 'gateway_error',
  capacity: 'capacity',
  forecast_period_out_of_range: 'forecast_period_out_of_range',
  missing_birth_details: 'missing_birth_details',
} as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ValidationDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface NormalizedApiError {
  code: string | null;
  message: string;
  errorString: string | null;
  status: number;
  category: ApiErrorCategory;
  action: AuthAction | null;
  field: string | null;
  retryAfterSeconds: number | null;
  paywall: PaywallData | null;
  featureKey: PaywallFeatureKey | string | null;
  idempotencyKey: string | null;
  isSoft: boolean;
  reason: string | null;
  requiredCredits: number | null;
  availableCredits: number | null;
  minTier: string | null;
  validationDetails: ValidationDetail[] | null;
  raw: Record<string, unknown> | null;
}

const FAMILY_CODE_SET: ReadonlySet<string> = new Set(FAMILY_INVITE_ERROR_CODES as readonly string[]);

function classifyByStatus(status: number): ApiErrorCategory {
  if (status === 401) return ApiErrorCategory.auth;
  if (status === 402) return ApiErrorCategory.paywall;
  if (status === 429) return ApiErrorCategory.rateLimit;
  if (status === 503) return ApiErrorCategory.capacity;
  if (status === 504) return ApiErrorCategory.server;
  if (status === 422) return ApiErrorCategory.validation;
  if (status >= 400 && status < 500) return ApiErrorCategory.client;
  if (status >= 500) return ApiErrorCategory.server;
  return ApiErrorCategory.client;
}

function isAuthPath(path?: string): boolean {
  if (!path) return false;
  return /^\/api\/(auth\/|login|register)/.test(path);
}

function strFrom(obj: unknown): string | null {
  return typeof obj === 'string' && obj ? obj : null;
}

function numFrom(obj: unknown): number | null {
  return typeof obj === 'number' ? obj : null;
}

export function normalizeApiError(
  body: unknown,
  status: number,
  path?: string,
): NormalizedApiError {
  const result: NormalizedApiError = {
    code: null,
    message: '',
    errorString: null,
    status,
    category: classifyByStatus(status),
    action: null,
    field: null,
    retryAfterSeconds: null,
    paywall: null,
    featureKey: null,
    idempotencyKey: null,
    isSoft: false,
    reason: null,
    requiredCredits: null,
    availableCredits: null,
    minTier: null,
    validationDetails: null,
    raw: null,
  };

  if (!body) return result;

  if (typeof body === 'string') {
    result.message = body;
    result.errorString = body;
    if (body.includes('_') && !body.includes(' ')) {
      result.code = body;
    }
    return result;
  }

  if (typeof body !== 'object') return result;

  const b = body as Record<string, unknown>;
  result.raw = b;

  const e = b.error;

  const eIsObj = typeof e === 'object' && e !== null;
  const eIsStr = typeof e === 'string';
  const inner = eIsObj ? (e as Record<string, unknown>) : null;

  const code: string | null =
    eIsObj ? strFrom(inner!.code ?? inner!.error) :
    eIsStr ? e :
    null;
  const bodyCode = strFrom(b.code);
  const detailObj = typeof b.detail === 'object' && b.detail !== null ? b.detail as Record<string, unknown> : null;
  const detailCode = detailObj ? strFrom(detailObj.code) : null;

  result.code = code ?? bodyCode ?? detailCode;

  const msg: string | null =
    eIsObj ? strFrom(inner!.message ?? b.message) :
    eIsStr ? e :
    strFrom(b.message);
  const detailMsg = typeof b.detail === 'string' ? b.detail : detailObj ? strFrom(detailObj.message) : null;

  result.message = msg ?? detailMsg ?? '';

  result.errorString =
    eIsStr ? e :
    eIsObj ? strFrom(inner!.error) :
    null;

  result.action =
    strFrom(b.action ?? (inner ? inner.action : null)) as AuthAction | null;

  result.field =
    strFrom(b.field ?? (inner ? inner.field : null) ?? (detailObj ? detailObj.field : null));

  result.retryAfterSeconds =
    numFrom(b.retryAfterSeconds ?? b.retry_after ?? (inner ? inner.retryAfterSeconds ?? inner.retry_after : null));

  // ── 422 FastAPI validation detail[] array ──
  if (status === 422 && Array.isArray(b.detail)) {
    const items = b.detail as unknown[];
    if (items.length > 0 && items[0] && typeof items[0] === 'object' && 'loc' in (items[0] as Record<string, unknown>)) {
      result.validationDetails = items as ValidationDetail[];
      result.message = result.validationDetails!.map(d => d.msg).join(', ');
    }
  }

  // ── Auth path overrides (Shape B) ──
  if (isAuthPath(path) && (status === 401 || status === 422 || status === 429)) {
    result.category = ApiErrorCategory.auth;
  }

  // ── 402 Paywall (§4a + §4b) ──
  if (status === 402) {
    result.category = ApiErrorCategory.paywall;

    if (eIsObj) {
      // §4a: Double-nested shape A → body.error = { error: "paywall_blocked", paywall: {...}, ... }
      const innerError = strFrom(inner!.error);
      const innerPaywall = inner!.paywall;

      if (innerError === 'paywall_blocked' || innerPaywall) {
        result.code = innerError ?? result.code;
        result.isSoft = inner!.isSoft === true;
        result.featureKey = strFrom(inner!.featureKey ?? inner!.feature_key);
        result.reason = strFrom(inner!.reason);
        result.requiredCredits = numFrom(inner!.requiredCredits ?? inner!.required_credits);
        result.availableCredits = numFrom(inner!.availableCredits ?? inner!.available_credits);
        result.minTier = strFrom(inner!.minTier ?? inner!.min_tier);
        result.message = strFrom(inner!.message) ?? result.message;

        if (innerPaywall && typeof innerPaywall === 'object') {
          result.paywall = innerPaywall as PaywallData;
        }
      }
    }

    if (eIsStr && e === 'paywall_blocked') {
      // §4b: Flat shape C → body.error = "paywall_blocked", body.paywall = {...}
      result.code = 'paywall_blocked';
      result.featureKey = strFrom(b.featureKey ?? b.feature_key);
      result.reason = strFrom(b.reason);
      result.requiredCredits = numFrom(b.requiredCredits ?? b.required_credits);
      result.availableCredits = numFrom(b.availableCredits ?? b.available_credits);
      result.minTier = strFrom(b.minTier ?? b.min_tier);
      result.isSoft = b.isSoft === true;

      if (b.paywall && typeof b.paywall === 'object') {
        result.paywall = b.paywall as PaywallData;
      }
    }
  }

  // ── Soft paywall marker (§4c) — 200 with paywall field ──
  if (status === 200 && b.paywall && typeof b.paywall === 'object') {
    result.isSoft = true;
    result.paywall = b.paywall as PaywallData;
    result.category = ApiErrorCategory.paywall;
  }

  // ── 409 Reservation pending (§4d) ──
  if (status === 409 && result.code === 'reservation_pending') {
    result.category = ApiErrorCategory.reservation;
    result.idempotencyKey = strFrom(
      inner ? inner.idempotency_key : null
    ) ?? strFrom(b.idempotency_key);
  }

  // ── 409 reservation_pending for family compat (flat shape) ──
  if (status === 409 && strFrom(b.error) === 'reservation_pending') {
    result.category = ApiErrorCategory.reservation;
    result.code = 'reservation_pending';
    result.idempotencyKey = strFrom(b.idempotency_key);
  }

  // ── 503 Capacity (§4e) ──
  if (status === 503) {
    result.category = ApiErrorCategory.capacity;
    if (!result.code || result.code !== 'capacity') {
      result.code = strFrom(b.errorCode ?? b.error_code) ?? 'capacity';
    }
  }

  // ── Family error codes override ──
  if (result.code && FAMILY_CODE_SET.has(result.code)) {
    result.category = ApiErrorCategory.family;
  }

  // ── Payment error codes override ──
  if (result.code === API_ERROR_CODES.payments_unconfigured || result.code === API_ERROR_CODES.gateway_error) {
    result.category = ApiErrorCategory.payment;
    if (inner && result.code === API_ERROR_CODES.gateway_error) {
      result.message = strFrom(inner.message) ?? result.message;
    }
  }

  // ── Admin error override (§3) ──
  if (status === 403) {
    if (result.message?.startsWith('Administrative') || result.code === 'admin_required') {
      result.category = ApiErrorCategory.admin;
    }
  }

  // ── Auth token reuse override (§2 special) ──
  if (status === 401 && typeof b.detail === 'string' && b.detail.includes('Token reuse detected')) {
    result.code = 'token_reuse_detected';
    result.category = ApiErrorCategory.auth;
    result.action = 'logout';
    result.message = strFrom(b.detail) ?? result.message;
  }

  return result;
}

export function isPaywallError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.paywall
    || err.code === 'paywall_blocked'
    || err.code === 'FAMILY_FREE_TIER_CAP';
}

export function isHardPaywall(err: NormalizedApiError): boolean {
  return isPaywallError(err) && !err.isSoft;
}

export function isSoftPaywall(err: NormalizedApiError): boolean {
  return isPaywallError(err) && err.isSoft;
}

export function isAuthError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.auth;
}

export function isCapacityError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.capacity;
}

export function isReservationPending(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.reservation || err.code === 'reservation_pending';
}

export function isFamilyError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.family;
}

export function isRateLimitError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.rateLimit;
}

export function isValidationError(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.validation;
}

export function shouldForceLogout(err: NormalizedApiError): boolean {
  return err.code === 'token_reuse_detected'
    || err.code === 'token_expired'
    || (err.category === ApiErrorCategory.auth && err.status === 401 && err.action === 'logout');
}

export function shouldTryRefresh(err: NormalizedApiError): boolean {
  return err.category === ApiErrorCategory.auth
    && err.status === 401
    && (err.code === 'token_expired' || err.code === 'token_invalid')
    && err.action !== 'logout';
}

export function getAuthAction(err: NormalizedApiError): AuthAction | null {
  return err.action;
}

export function extractPaywallData(err: NormalizedApiError): PaywallData | null {
  return err.paywall;
}

export function getLocalizedApiError(
  err: NormalizedApiError,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (err.code) {
    const prefixes = err.category === ApiErrorCategory.auth
      ? ['auth.errors', 'errors']
      : ['errors', 'auth.errors'];
    for (const prefix of prefixes) {
      const key = `${prefix}.${err.code}`;
      const localized = t(key);
      if (localized && localized !== key) return localized;
    }
  }

  if (err.message) return err.message;

  const statusMessages: Record<number, string> = {
    401: t('errors.unauthorized'),
    402: t('errors.paywall'),
    403: t('errors.forbidden'),
    404: t('errors.notFound'),
    409: t('errors.conflict'),
    422: t('errors.validation'),
    429: t('errors.rateLimit'),
    503: t('errors.capacity'),
    504: t('errors.timeout'),
    500: t('errors.server'),
  };
  return statusMessages[err.status] ?? t('errors.generic');
}