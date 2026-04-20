import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const daysBack = searchParams.get('days_back') || '3';
        const daysForward = searchParams.get('days_forward') || '3';

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        if (!process.env.AI_BACKEND_URL) {
            return NextResponse.json({ error: "Backend service not configured." }, { status: 503 });
        }

        const url = `${process.env.AI_BACKEND_URL}/api/forecast/health?email=${encodeURIComponent(email)}&days_back=${daysBack}&days_forward=${daysForward}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.AI_BACKEND_API_KEY || '',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[HealthForecast] Backend error: ${response.status}`, errorData);
            return NextResponse.json(
                { error: errorData.error || "Health forecast service unavailable." },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("[HealthForecast] Request failed:", error);
        return NextResponse.json(
            { error: "Failed to retrieve health forecast." },
            { status: 500 }
        );
    }
}
