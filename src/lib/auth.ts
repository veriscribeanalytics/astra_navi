import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { JWT } from "next-auth/jwt";

const refreshPromises = new Map<string, Promise<JWT>>();

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const tokenKey = (token.refreshToken as string) || (token.sub as string) || 'default';
  
  // Deduplicate concurrent refresh attempts with the SAME old refresh token.
  // If a refresh is already in-flight, return the shared promise.
  // If a refresh SUCCEEDED recently, the cached (resolved) promise prevents
  // sending the already-revoked old refresh token a second time.
  if (refreshPromises.has(tokenKey)) {
    return refreshPromises.get(tokenKey)!;
  }

  const promise = (async () => {
    let refreshFailed = false;
    try {
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
      
      return {
        ...token,
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
        accessTokenExpires: Date.now() + expiresIn * 1000,
      };
    } catch (error: unknown) {
      refreshFailed = true;
      console.error("[Auth] RefreshAccessToken error:", error);
      
      const err = error as Record<string, unknown>;
      const errorCode = err?.code || (err?.error as Record<string, unknown>)?.code;
      const isFatal = ["token_reuse_detected", "token_expired", "token_invalid"].includes(errorCode as string) || 
                      err?.error === "Token reuse detected" || 
                      err?.detail === "Token reuse detected" || 
                      err?.message === "Token reuse detected" ||
                      err?.status === 401 ||
                      err?.status === 429;

      return {
        ...token,
        error: isFatal ? "TokenReuseError" : "RefreshAccessTokenError",
      };
    } finally {
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
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRegistration: { type: "hidden" },
        id: { type: "hidden" },
        name: { type: "hidden" },
        phoneNumber: { type: "hidden" },
        accessToken: { type: "hidden" },
        refreshToken: { type: "hidden" },
        expiresIn: { type: "hidden" },
      },
async authorize(credentials) {
         if (credentials?.isRegistration === "true") {
            const regExpiresIn = (typeof credentials.expiresIn === 'number' && credentials.expiresIn > 0)
              ? credentials.expiresIn
              : (typeof credentials.expiresIn === 'string' && parseInt(credentials.expiresIn) > 0)
                ? parseInt(credentials.expiresIn)
                : 3600;
            return {
               id: credentials.id as string,
               email: credentials.email as string | null | undefined,
               phoneNumber: credentials.phoneNumber as string | null | undefined,
               name: credentials.name as string,
               accessToken: credentials.accessToken as string,
               refreshToken: credentials.refreshToken as string,
               accessTokenExpires: Date.now() + regExpiresIn * 1000,
            };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
            // Call backend login endpoint (PostgreSQL)
            const backendUrl = process.env.AI_BACKEND_URL;
            
            if (!backendUrl) {
              console.error("[Auth] AI_BACKEND_URL is not configured");
              throw new Error("NetworkError");
            }

            let res: Response;
            try {
              res = await fetch(`${backendUrl}/api/login`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-API-Key': process.env.AI_BACKEND_API_KEY || '',
                },
                body: JSON.stringify({
                  email: credentials.email,
                  password: credentials.password,
                }),
              });
            } catch (fetchError: unknown) {
              // Network-level error: ECONNREFUSED, ENOTFOUND, timeout, etc.
              const err = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
              console.error("[Auth] Backend unreachable:", err.message);
              throw new Error("NetworkError");
            }
            
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("[Auth] Non-JSON response from backend:", text);
                throw new Error("ServerError");
            }

            const data = await res.json();
            
            if (!res.ok) {
                console.error("[Auth] Login failed:", data.error || res.statusText);
                // Return error message for display
                throw new Error(data.error || "Invalid credentials.");
            }
            
            // Guard: if expiresIn is missing or invalid, default to 1 hour
            const expiresIn = (typeof data.expiresIn === 'number' && data.expiresIn > 0) 
              ? data.expiresIn 
              : 3600; // default 1 hour
            
            // Return user object + tokens for JWT session
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              image: data.user.image,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: Date.now() + expiresIn * 1000,
            };
        } catch (error: unknown) {
            console.error("[Auth] Authorize error:", error);
            // Re-throw to pass the error message to the client
            if (error instanceof Error) throw error;
            throw new Error(String(error));
        }
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
      if (account?.provider === 'google' && account.id_token) {
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
            console.error('[Auth] Google OAuth backend exchange failed:', data.error || res.status);
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
          console.error('[Auth] Google OAuth exchange error:', error);
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
        // RefreshAccessTokenError is TRANSIENT (network issue, etc.).
        // Persist the error so the middleware (auth.config.ts) can detect
        // and redirect the user to /login before the page loads.  Extend
        // expiry by 60s so the current response still has a usable token.
        console.error("[Auth] JWT callback: Refresh failed with:", refreshed.error,
          "— Persisting error in JWT cookie. Extending token by 60s to serve current request.");
        return {
          ...token,
          error: "RefreshAccessTokenError",
          accessTokenExpires: Date.now() + 60 * 1000, // 60s grace
        };
      }
      
      return refreshed;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        (session.user as any).email = token.email;
        session.user.phoneNumber = token.phoneNumber;
        session.user.error = token.error;
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
