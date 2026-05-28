import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const age = searchParams.get('age');
  const lang = searchParams.get('lang') || 'en';

  const qs = new URLSearchParams();
  if (age) qs.set('age', age);
  qs.set('lang', lang);

  const response = await backendFetch(`/api/consult/tree?${qs.toString()}`);
  const data = await response.json();
  return Response.json(data);
}
