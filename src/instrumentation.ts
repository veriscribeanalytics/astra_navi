/**
 * Next.js instrumentation hook — runs ONCE when the server starts (and once per
 * serverless cold start), NOT on every request. This is the canonical place to
 * fail fast on missing configuration: before this existed the app would build
 * and start happily without AUTH_SECRET / AI_BACKEND_URL / Redis credentials and
 * only blow up at the first request that touched those code paths — surfacing a
 * 500 to a real user instead of a boot-time error to the operator.
 *
 * Phase gating
 * ------------
 * `register` fires in several Next phases. We ONLY validate during the server
 * RUNTIME phases (production-server, development-server, test). We deliberately
 * SKIP `phase-production-build`: `next build` must succeed without secrets in CI
 * (the build does not need a live backend or Redis, and CI does not provision
 * them). Validating at build time would make every secret-less CI build fail.
 *
 * CI escape hatch
 * ---------------
 * CI runs `next start` (the production server) under `CI=true` WITHOUT the real
 * UPSTASH/AI_BACKEND secrets — Playwright mocks those endpoints, and the
 * session-nonce/rate-limit code paths fail closed at runtime, which the tests
 * account for. A hard throw here would break that hermetic E2E gate, so when
 * `CI=true` we skip the hard validation entirely. Real deployments (no CI flag)
 * get the full fail-fast check.
 *
 * What's required vs optional
 * ---------------------------
 * REQUIRED (throw → server refuses to boot): AUTH_SECRET (JWT signing — without
 *   it every session is forgeable/undecryptable), AI_BACKEND_URL +
 *   AI_BACKEND_API_KEY (every BFF route needs them), and the Upstash Redis pair
 *   (session-nonce + rate limiter both require Redis and fail closed without it
 *   — better to refuse boot than silently disable auth protection).
 * WARN-ONLY: Google OAuth (an optional provider — the app must run without it),
 *   the public voice WS URL, and the DPDP grievance officer name.
 */
export async function register() {
  // Only validate at server runtime, not during `next build` / `next export`.
  const phase = process.env.NEXT_PHASE;
  const RUNTIME_PHASES = new Set([
    'phase-production-server',
    'phase-development-server',
    'phase-test',
  ]);
  if (!phase || !RUNTIME_PHASES.has(phase)) {
    return;
  }

  // CI runs the production server without the real secrets (Playwright mocks
  // them). Don't gate the E2E suite on env validation.
  if (process.env.CI === 'true') {
    return;
  }

  const missing: string[] = [];
  const require = (name: string) => {
    if (!process.env[name] || process.env[name]!.trim() === '') {
      missing.push(name);
    }
  };

  // --- Required: auth + backend + Redis -----------------------------------
  require('AUTH_SECRET');
  require('AI_BACKEND_URL');
  require('AI_BACKEND_API_KEY');
  require('UPSTASH_REDIS_REST_URL');
  require('UPSTASH_REDIS_REST_TOKEN');

  // --- Optional: warn-only -----------------------------------------------
  const warn = (name: string, note: string) => {
    if (!process.env[name] || process.env[name]!.trim() === '') {
      console.warn(`[instrumentation] Optional env var ${name} is not set. ${note}`);
    }
  };
  warn('AUTH_GOOGLE_ID', 'Google sign-in will be unavailable.');
  warn('AUTH_GOOGLE_SECRET', 'Google sign-in will be unavailable.');
  warn('NEXT_PUBLIC_VOICE_WS_URL', 'Voice STT (mic) will not connect.');
  warn('NEXT_PUBLIC_DPDP_GRIEVANCE_OFFICER_NAME', 'Falls back to "Data Protection Officer".');

  if (missing.length > 0) {
    const msg =
      `[instrumentation] Refusing to start: required environment variables are ` +
      `missing or empty: ${missing.join(', ')}.\n` +
      `These are needed at server runtime (auth, backend proxy, Redis-backed ` +
      `session nonce / rate limiting). Set them in your deployment environment ` +
      `(see .env.example for the full list) and restart.`;
    console.error(msg);
    throw new Error(msg);
  }
}
