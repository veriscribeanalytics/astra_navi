import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { JWT } from "next-auth/jwt";
import {
  getCachedRotation,
  setCachedRotation,
  acquireRefreshLock,
  releaseRefreshLock,
  waitForRotation,
} from "./refreshCache";
import { consumeSessionNonce } from "./sessionNonce";
import { isRefreshFailureFatal } from "./refreshError";

const refreshPromises = new Map<string, Promise<JWT>>();

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const tokenKey = (token.refreshToken as string) || (token.sub as string) || 'default';

  // Deduplicate concurrent refresh attempts with the SAME old refresh token.
  // If a refresh is already in-flight, return the shared promise.
  // If a refresh SUCCEEDED recently, the cached (resolved) promise prevents
  // sending the already-revoked old refresh token a second time.
  //
  // NOTE: this Map only coordinates within ONE process. The Redis layer below
  // (refreshCache) extends the same guarantee ACROSS instances/tabs, which is
  // what actually prevents the "same T1 sent twice ~5s apart" reuse logout.
  if (refreshPromises.has(tokenKey)) {
    return refreshPromises.get(tokenKey)!;
  }

  const oldRefreshToken = token.refreshToken as string;

  const promise = (async () => {
    let refreshFailed = false;
    let lockAcquired = false;
    try {
      // (1) Cross-instance short-circuit: another instance may have already
      // rotated THIS token seconds ago. Reuse its result instead of resending
      // the now-revoked token.
      if (oldRefreshToken) {
        const preCached = await getCachedRotation(oldRefreshToken);
        if (preCached) {
          console.warn("[Auth] Reusing cross-instance cached rotation; skipping backend refresh.");
          return {
            ...token,
            accessToken: preCached.accessToken,
            refreshToken: preCached.refreshToken,
            accessTokenExpires: preCached.accessTokenExpires,
          };
        }

        // (2) Become the single rotator for this token. If we lose the lock,
        // wait for the winner to publish the rotated pair.
        lockAcquired = await acquireRefreshLock(oldRefreshToken);
        if (!lockAcquired) {
          const waited = await waitForRotation(oldRefreshToken);
          if (waited) {
            console.warn("[Auth] Lost refresh lock; reusing winner's rotated pair.");
            return {
              ...token,
              accessToken: waited.accessToken,
              refreshToken: waited.refreshToken,
              accessTokenExpires: waited.accessTokenExpires,
            };
          }
          // Winner never published (crash/Redis hiccup) — fall through and try
          // ourselves. Backend reuse detection remains the final backstop.
          console.warn("[Auth] Lock winner never published; attempting own refresh.");
        }
      }

      const backendUrl = process.env.AI_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.AI_BACKEND_API_KEY || '',
        },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      const refreshedTokens = await response.json();

      if (!response.ok) {
        // Refresh failed — backend says the token is invalid/revoked/expired.
        console.error("[Auth] Refresh failed:", response.status, refreshedTokens);
        throw { ...refreshedTokens, status: response.status };
      }

      const expiresIn = (typeof refreshedTokens.expiresIn === 'number' && refreshedTokens.expiresIn > 0)
        ? refreshedTokens.expiresIn
        : 3600;

      const accessTokenExpires = Date.now() + expiresIn * 1000;

      // Publish for concurrent/straggling callers still holding oldRefreshToken.
      if (oldRefreshToken) {
        await setCachedRotation(oldRefreshToken, {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          accessTokenExpires,
        });
      }

      return {
        ...token,
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        accessTokenExpires,
      };
    } catch (error: unknown) {
      refreshFailed = true;
      console.error("[Auth] RefreshAccessToken error:", error);

      // FATAL = the refresh token is revoked/expired/reused; the session is
      // unrecoverable and must be torn down. A 429 (Too Many Requests) is NOT
      // fatal — the backend temporarily throttled us, the token is still valid,
      // and the user should NOT be signed out. See isRefreshFailureFatal().
      const isFatal = isRefreshFailureFatal(error);

      // Reuse-recovery: a 401/"reuse detected" most often means a PEER instance
      // rotated this exact token microseconds before us (the cross-instance race
      // this whole module fights). Before nuking the session, check once more
      // whether that peer published its rotated pair — if so, adopt it and turn
      // a would-be forced-logout into a successful refresh.
      if (isFatal && oldRefreshToken) {
        const peerRotation = await getCachedRotation(oldRefreshToken);
        if (peerRotation) {
          console.warn("[Auth] Backend reported reuse, but a peer rotation was cached — recovering with it.");
          refreshFailed = false;
          return {
            ...token,
            accessToken: peerRotation.accessToken,
            refreshToken: peerRotation.refreshToken,
            accessTokenExpires: peerRotation.accessTokenExpires,
          };
        }
      }

      return {
        ...token,
        error: isFatal ? "TokenReuseError" : "RefreshAccessTokenError",
      };
    } finally {
      // Release the cross-instance lock (no-op if we never held it) so we don't
      // wait out its TTL. Publishing happened before this on the success path.
      if (lockAcquired && oldRefreshToken) {
        await releaseRefreshLock(oldRefreshToken);
      }
      if (refreshFailed) {
        // FAILURE: delete immediately so a future JWT callback can retry.
        refreshPromises.delete(tokenKey);
      } else {
        // SUCCESS: keep cached for 10 seconds so concurrent requests with the
        //   same old refreshToken (from before the JWT cookie propagated) share
        //   the successful result instead of sending the now-revoked token again.
        //   Scheduled cleanup prevents memory leaks from stale entries.
        setTimeout(() => {
          refreshPromises.delete(tokenKey);
        }, 10_000);
      }
    }
  })();

  refreshPromises.set(tokenKey, promise);
  return promise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // NO database adapter - using pure JWT session strategy
  providers: [
    Credentials({
      name: "credentials",
      // The only credential the browser ever submits now is a single-use nonce
      // minted by a server-side BFF route (/api/register or /api/login), which
      // is the ONLY path that talks to the backend and obtains real tokens.
      // `authorize()` consumes the nonce from Redis and adopts the server-fetched
      // identity — it never trusts browser-supplied id/email/tokens. That closes
      // the prior bypass where `isRegistration: "true"` made the provider adopt
      // an attacker-forged identity verbatim.
      credentials: {
        sessionNonce: { type: "text" },
      },
      async authorize(credentials) {
        const nonce = typeof credentials?.sessionNonce === 'string' ? credentials.sessionNonce : '';
        if (!nonce) return null;

        // consumeSessionNonce returns the stored payload AND deletes the key, so
        // the nonce is single-use. A forged or replayed nonce yields null → the
        // sign-in fails. Redis failure also fails closed (returns null) — never
        // trusting client identity.
        const payload = await consumeSessionNonce(nonce);
        if (!payload) return null;

        const expiresIn =
          typeof payload.expiresIn === 'number' && payload.expiresIn > 0
            ? payload.expiresIn
            : 3600;

        return {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          image: payload.image ?? null,
          phoneNumber: payload.phoneNumber ?? null,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          accessTokenExpires: Date.now() + expiresIn * 1000,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — session cookie lifetime
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Google OAuth sign-in: exchange Google id_token for backend tokens
      if (account?.provider === 'google') {
        if (!account.id_token) {
          console.error('[Auth] Google OAuth returned no id_token. Available account keys:', Object.keys(account || {}));
          return { ...token, error: 'GoogleExchangeError' };
        }
        try {
          const backendUrl = process.env.AI_BACKEND_URL;
          if (!backendUrl) {
            console.error('[Auth] AI_BACKEND_URL is not configured for Google OAuth exchange');
            return { ...token, error: 'GoogleExchangeError' };
          }

          const res = await fetch(`${backendUrl}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.AI_BACKEND_API_KEY || '',
            },
            body: JSON.stringify({ idToken: account.id_token }),
          });

          const data = await res.json();

          if (!res.ok) {
            // Log only non-secret diagnostic fields — never JSON.stringify the
            // full backend body, which can contain access/refresh tokens.
            console.error('[Auth] Google OAuth backend exchange failed:', {
              status: res.status,
              statusText: res.statusText,
              error: data.error || data.detail || data.message || null,
            });
            return { ...token, error: 'GoogleExchangeError' };
          }

          if (!data?.user?.id || !data?.accessToken) {
            console.error('[Auth] Google OAuth backend returned 200 but missing required fields:', {
              hasUser: !!data?.user,
              hasUserId: !!data?.user?.id,
              hasAccessToken: !!data?.accessToken,
            });
            return { ...token, error: 'GoogleExchangeError' };
          }

          const expiresIn = (typeof data.expiresIn === 'number' && data.expiresIn > 0)
            ? data.expiresIn
            : 3600;

          return {
            ...token,
            id: data.user.id,
            email: data.user.email ?? user?.email,
            name: data.user.name ?? user?.name,
            phoneNumber: data.user.phoneNumber ?? null,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpires: Date.now() + expiresIn * 1000,
            // Routing hint for the landing page: Google/OAuth can't collect
            // birth details, so a fresh OAuth user is almost always incomplete.
            profileComplete: data.profileComplete === true,
          };
        } catch (error) {
          console.error('[Auth] Google OAuth exchange error:', error instanceof Error ? error.message : error);
          return { ...token, error: 'GoogleExchangeError' };
        }
      }

      if (user) {
        return {
          ...token,
          id: user.id as string,
          email: user.email,
          phoneNumber: user.phoneNumber,
          name: user.name,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpires: user.accessTokenExpires as number,
        };
      }

      // Client-driven session update (next-auth `update()`), called after the
      // user completes onboarding. Refresh the onboarding hint on the JWT so
      // the server-side gate in app/page.tsx stops redirecting them — without
      // this the flag stays false forever and a completed user loops back to
      // /profile on every visit.
      if (
        trigger === 'update' &&
        session &&
        typeof (session as { profileComplete?: unknown }).profileComplete === 'boolean'
      ) {
        token.profileComplete = (session as { profileComplete?: boolean }).profileComplete;
      }

      if (token.error) {
        // Don't attempt refresh if there's already an error — just pass it through
        // so the client/session callback can see it and decide what to do.
        return token;
      }

      const expiresAt = token.accessTokenExpires as number;
      const now = Date.now();
      
      // If token is not expired, return as-is
      if (now < expiresAt) {
        return token;
      }

      // Token is expired — try refresh
      const refreshed = await refreshAccessToken(token);
      
      if (refreshed.error) {
        if (refreshed.error === "TokenReuseError") {
          // TokenReuseError is UNRECOVERABLE — the refresh token was already
          // used and revoked by the backend. No retry can succeed.
          // Persist the error in the JWT cookie so the session callback
          // propagates it to the client, which will initiate sign-out.
          console.error("[Auth] JWT callback: TokenReuseError — token was reused/revoked. "
            + "Persisting error so client can sign out.");
          return refreshed;
        }
        // RefreshAccessTokenError is TRANSIENT (network issue, 429 backend
        // rate-limit, 5xx, etc.). The token is still valid — we just couldn't
        // rotate it THIS time. Do NOT persist an `error` field: the middleware
        // gate treats any token.error as a session error and would redirect a
        // perfectly valid user to /login. Instead, extend the current token's
        // expiry by a short grace window so this request is served, and let the
        // NEXT request retry the refresh. (Bumping expiry rather than clearing
        // the error avoids a logout storm on a flaky backend / a 429 that would
        // otherwise have signed the user out the moment refresh was throttled.)
        console.error("[Auth] JWT callback: Refresh failed transiently with:",
          refreshed.error, "— extending token by 60s grace; will retry next request.");
        return {
          ...token,
          accessTokenExpires: Date.now() + 60 * 1000, // 60s grace, no error flag
        };
      }

      return refreshed;
    },
    async session({ session, token }) {
      if (session.user) {
        // Cast to the augmented Session.user shape (see types/next-auth.d.ts) so
        // the optional/nullable email + phoneNumber fields accept token values
        // without resorting to `any`. DefaultSession declares email as a
        // required string; our augmentation widens it, and this cast names that.
        const u = session.user as {
          id: string;
          email?: string | null;
          phoneNumber?: string | null;
          error?: string;
          profileComplete?: boolean;
        };
        u.id = token.id;
        u.email = token.email ?? null;
        u.phoneNumber = token.phoneNumber ?? null;
        u.error = token.error;
        // Only present for OAuth sign-ins — used as an initial onboarding hint.
        if (typeof token.profileComplete === 'boolean') {
          session.user.profileComplete = token.profileComplete;
        }
      }
      return session;
    },
    ...authConfig.callbacks,
  },
});
