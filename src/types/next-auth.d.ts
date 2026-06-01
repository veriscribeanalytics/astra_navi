import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      phoneNumber?: string | null;
      accessToken?: string;
      refreshToken?: string;
      error?: string;
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
  }
}
