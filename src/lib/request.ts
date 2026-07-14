/**
 * Resolve a client identity for rate limiting, without blindly trusting
 * client-controlled forwarding headers.
 *
 * Why this exists
 * ---------------
 * `x-forwarded-for` and `x-real-ip` are request headers a client can set to
 * anything. The old code did
 *     req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
 * and used that string verbatim as the rate-limit key. An attacker rotating a
 * spoofed `X-Forwarded-For` value on every request gets a fresh bucket each
 * time and bypasses login/OTP/registration throttling entirely — even though
 * they all originate from one machine.
 *
 * Mitigation
 * ----------
 * `x-forwarded-for` is a comma-separated chain `client, proxy1, proxy2`. Only
 * the FIRST entry is the original client (and even that is only trustworthy if
 * your reverse proxy overwrites rather than appends to it). We take the single
 * leftmost token, trim it, and validate it looks like an IP / host token (no
 * spaces, bounded length). If the header is absent or malformed we fall back
 * to `'unknown'` — which buckets every anonymous request together, so they
 * still share one limiter and can't fragment the bucket by omitting the
 * header either.
 *
 * NOTE for deployment: for true per-IP fairness your production load balancer
 * MUST strip/overwrite `X-Forwarded-For` so clients can't inject their own
 * values upstream of it. This helper makes the best of whatever the proxy
 * leaves; it does not replace a correctly-configured proxy.
 */

const IP_TOKEN_LIMIT = 64; // IPv6 string + zone id headroom; reject absurd values.

/**
 * Extract a single, sanitized identity token from a request for rate limiting.
 * Never returns the raw header verbatim; always a trimmed, length-bounded
 * token or `'unknown'`.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // Leftmost hop is the original client. The proxies after it are our own
    // infrastructure, not attacker-controlled (assuming a correctly-configured
    // upstream LB — see the module note).
    const first = xff.split(',')[0]?.trim();
    if (first && first.length <= IP_TOKEN_LIMIT && !/\s/.test(first)) {
      return first;
    }
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    const trimmed = realIp.trim();
    if (trimmed && trimmed.length <= IP_TOKEN_LIMIT && !/\s/.test(trimmed)) {
      return trimmed;
    }
  }

  return 'unknown';
}
