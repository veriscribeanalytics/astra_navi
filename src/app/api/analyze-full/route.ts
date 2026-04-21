import { NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { AnalyzeFullSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Full Analysis API Route (Proxy Mode)
 * 
 * Proxies interpretation requests to FastAPI backend.
 * Backend handles PostgreSQL storage of structured insights.
 */
export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session) return unauthorizedResponse();
        const email = session.user?.email;

        const body = await req.json();
        const validation = AnalyzeFullSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const response = await backendFetch('/api/analyze-full', {
            method: 'POST',
            userEmail: email as string,
            body: JSON.stringify(validation.data)
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ 
                error: data.error || data.detail || "Interpretation failed." 
            }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Analyze full error:", error);
        return NextResponse.json({ 
            error: "An unexpected error occurred during full analysis." 
        }, { status: 500 });
    }
}
