import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

/**
 * Refresh Token API Route (Proxy Mode)
 * 
 * Proxies refresh requests to the FastAPI backend.
 * Rotates both Access and Refresh tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
    }

    const response = await backendFetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to refresh token' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Failed to refresh celestial session' }, { status: 500 });
  }
}
