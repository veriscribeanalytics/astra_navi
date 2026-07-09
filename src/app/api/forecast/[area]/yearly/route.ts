import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

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
        const validAreas = ['health', 'career', 'love', 'finance', 'overall', 'general', 'spiritual'];
        if (!validAreas.includes(area)) {
            return NextResponse.json({ error: `Invalid forecast area: ${area}` }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const lang = searchParams.get('lang') || null;
        const fullLangName = languageCodeToName(lang);

        const url = `/api/forecast/${area}/yearly?lang=${encodeURIComponent(fullLangName)}`;

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
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            }
        });

    } catch (error) {
        const { area } = await params;
        console.error(`${area} yearly forecast error:`, error);
        return NextResponse.json(
            { error: `Failed to retrieve ${area} yearly forecast.` },
            { status: 500 }
        );
    }
}