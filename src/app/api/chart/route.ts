import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentDateTime } from '@/lib/datetime';
import { extractRashiSigns } from '@/utils/chartParser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, dob, tob, place } = body;
    const backendUrl = process.env.AI_BACKEND_URL;
    
    if (!backendUrl) {
      return NextResponse.json({ 
        error: 'AI Backend Configuration Missing', 
        message: 'AI_BACKEND_URL environment variable is not set. Please configure it in .env.local'
      }, { status: 500 });
    }

    const response = await fetch(`${backendUrl}/api/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dob, tob, place }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Backend error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const chartContext = data.chart_context;

    // AUTO-UPDATE USER PROFILE IF EMAIL IS PROVIDED
    if (email && chartContext) {
      try {
        const client = await clientPromise;
        const db = client.db('astra-navi-database');
        const users = db.collection('users');

        const userProfile = await users.findOne({ email });
        if (userProfile) {
          const { sunSign, moonSign } = extractRashiSigns(chartContext);
          
          const profileUpdate: any = { 
            chartContext,
            "preferences.chartContext": chartContext,
            updatedAt: getCurrentDateTime() 
          };
          
          if (sunSign) {
            profileUpdate.sunSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
          }
          if (moonSign) {
            profileUpdate.moonSign = moonSign.charAt(0).toUpperCase() + moonSign.slice(1).toLowerCase();
          }

          await users.updateOne({ email }, { $set: profileUpdate });
          console.log(`Auto-updated chart context and signs via /api/chart for ${email}`);
        }
      } catch (dbError) {
        console.error('Database update error in /api/chart:', dbError);
        // We don't fail the request if DB update fails, just log it
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chart proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
