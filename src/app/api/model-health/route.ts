import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.AI_BACKEND_URL;
    
    if (!backendUrl) {
      return NextResponse.json({ 
        error: 'AI Backend Configuration Missing', 
        message: 'AI_BACKEND_URL environment variable is not set. Please configure it in .env.local'
      }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend error: ${response.status}` }, { status: response.status });
    }

    const data = await response.text();
    return NextResponse.json({ message: 'Model backend is reachable', data });
  } catch (error) {
    console.error('Model health check error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI backend' }, { status: 500 });
  }
}
