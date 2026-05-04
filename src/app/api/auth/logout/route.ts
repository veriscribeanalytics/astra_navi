import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';
import { getAuthSession } from '@/lib/session';

/**
 * Logout API Route (Proxy Mode)
 * 
 * Proxies logout requests to the FastAPI backend to invalidate tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;
    
    // We might also need the accessToken for Bearer auth if the backend requires it
    const session = await getAuthSession();
    const accessToken = (session?.user as any)?.accessToken;

    const response = await backendFetch('/api/auth/logout', {
      method: 'POST',
      accessToken: accessToken as string, // Include accessToken if available
      body: JSON.stringify({ refreshToken })
    });

    // Even if backend logout fails, we want the frontend to proceed with its own logout
    // but we return the status for debugging.
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn('Backend logout warning:', data.error || response.statusText);
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json({ message: "Logged out locally" }, { status: 200 });
  }
}
