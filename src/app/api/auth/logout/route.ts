import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { backendFetch } from "@/lib/backendClient";

/**
 * Server-side logout route.
 * Extracts the refresh token from the JWT (server-only) and 
 * notifies the backend to invalidate it.
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (token?.refreshToken) {
      // Notify backend to invalidate the refresh token
      await backendFetch('/api/auth/logout', {
        method: 'POST',
        accessToken: token.accessToken as string,
        body: JSON.stringify({ refreshToken: token.refreshToken })
      }).catch(err => console.warn('[Logout Route] Backend logout failed:', err));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Logout Route] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
