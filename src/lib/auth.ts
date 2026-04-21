import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

/**
 * NextAuth Configuration (PostgreSQL/JWT Mode)
 * 
 * MongoDB dependency has been removed. All user data now lives 
 * in the PostgreSQL backend. The authorize() callback proxies 
 * login requests to the FastAPI backend.
 */
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
            const backendUrl = process.env.AI_BACKEND_URL || "http://localhost:5051";
            const res = await fetch(`${backendUrl}/api/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("[Auth] Login failed:", errorData.error || res.statusText);
                return null;
            }
            
            const data = await res.json();
            
            // Return user object for JWT session
            // Note: backend returns user in 'user' field
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              image: data.user.image,
            };
        } catch (error) {
            console.error("[Auth] Authorize error:", error);
            return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    ...authConfig.callbacks,
  },
});
