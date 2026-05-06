import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.AI_BACKEND_URL;
    
    if (!backendUrl) {
      return NextResponse.json({ 
        error: 'AI Backend Configuration Missing', 
        message: 'AI_BACKEND_URL environment variable is not set. Please configure it in .env.local'
      }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/api/status`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Status proxy error:', error);
    return NextResponse.json({ status: 'offline', error: 'Failed to connect to AI backend' });
  }
}
