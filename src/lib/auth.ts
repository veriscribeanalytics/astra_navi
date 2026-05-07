import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { JWT } from "next-auth/jwt";

let refreshPromise: Promise<JWT> | null = null;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
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
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
        accessToken: { type: "hidden" },
        refreshToken: { type: "hidden" },
        expiresIn: { type: "hidden" },
      },
      async authorize(credentials) {
        if (credentials?.isRegistration === "true") {
           return {
              id: credentials.id as string,
              email: credentials.email as string,
              name: credentials.name as string,
              accessToken: credentials.accessToken as string,
              refreshToken: credentials.refreshToken as string,
              accessTokenExpires: Date.now() + parseInt(credentials.expiresIn as string) * 1000,
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
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        return {
          ...token,
          id: user.id as string,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpires: user.accessTokenExpires as number,
        };
      }

      if (token.error) {
        return token;
      }

      const expiresAt = token.accessTokenExpires as number;
      const now = Date.now();
      
      if (now < expiresAt) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.error = token.error;
      }
      return session;
    },
    ...authConfig.callbacks,
  },
});
