import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { JWT } from "next-auth/jwt";

/**
 * NextAuth Configuration (PostgreSQL/JWT Mode)
 * 
 * MongoDB dependency has been removed. All user data now lives 
 * in the PostgreSQL backend. The authorize() callback proxies 
 * login requests to the FastAPI backend.
 * 
 * Updated to support Access/Refresh Token architecture.
 */

async function refreshAccessToken(token: JWT): Promise<JWT> {
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
      throw refreshedTokens;
    }

    // Guard: if expiresIn is missing or invalid, default to 1 hour
    const expiresIn = (typeof refreshedTokens.expiresIn === 'number' && refreshedTokens.expiresIn > 0) 
      ? refreshedTokens.expiresIn 
      : 3600;
    
    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fallback to old refresh token
      accessTokenExpires: Date.now() + expiresIn * 1000,
    };
  } catch (error) {
    console.error("[Auth] RefreshAccessToken error:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
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
      },
      async authorize(credentials) {
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
      // Initial sign in
      if (user && account) {
        return {
          ...token,
          id: user.id as string,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpires: user.accessTokenExpires as number,
        };
      }

      // Return previous token if the access token has not expired yet
      const expiresAt = token.accessTokenExpires as number;
      const now = Date.now();
      
      if (now < expiresAt) {
        return token;
      }

      // Access token has expired, try to update it
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
