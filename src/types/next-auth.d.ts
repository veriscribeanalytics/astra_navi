import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      phoneNumber?: string | null;
      error?: string;
      /** OAuth-only onboarding hint set at sign-in; live profile fetch is the source of truth thereafter. */
      profileComplete?: boolean;
      /** Admin role hint threaded from the backend `is_admin` claim/field.
       *  Gates the `/admin/*` routes. Falsey when absent (non-admin users). */
      isAdmin?: boolean;
    } & Omit<DefaultSession['user'], 'email'>;
  }

  interface User {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    email?: string | null;
    phoneNumber?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    email?: string | null;
    phoneNumber?: string | null;
    error?: string;
    profileComplete?: boolean;
    isAdmin?: boolean;
  }
}
