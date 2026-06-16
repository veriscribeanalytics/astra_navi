import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { languageCodeToName } from '@/locales';

export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const lang = searchParams.get('lang') || null;
        const chartContext = searchParams.get('chart_context');
        const fullLangName = languageCodeToName(lang);

        const query = new URLSearchParams();
        if (date) query.set('date', date);
        if (chartContext) query.set('chart_context', chartContext);
        query.set('lang', fullLangName);

        const url = `/api/forecast/all/weekly?${query.toString()}`;

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
        console.error('all weekly forecasts error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve weekly forecasts.' },
            { status: 500 }
        );
    }
}
