import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

const VALID_AREAS = ['career', 'love', 'health', 'finance', 'general'];

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ area: string }> }
) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const { area } = await params;
        if (!VALID_AREAS.includes(area)) {
            return NextResponse.json({ error: `Invalid forecast area: ${area}` }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const lang = searchParams.get('lang') || null;
        const fullLangName = languageCodeToName(lang);

        const query = new URLSearchParams();
        if (date) query.set('date', date);
        query.set('lang', fullLangName);

        const url = `/api/forecast/${area}/weekly?${query.toString()}`;

        const response = await backendFetch(url, {
            userEmail: email as string,
            accessToken: accessToken as string
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate',
                'Vary': 'Cookie',
            }
        });

    } catch (error) {
        const { area } = await params;
        console.error(`${area} weekly forecast error:`, error);
        return NextResponse.json(
            { error: `Failed to retrieve ${area} weekly forecast.` },
            { status: 500 }
        );
    }
}
