import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const age = searchParams.get('age');
  const response = await backendFetch(`/api/consult/tree${age ? `?age=${age}` : ''}`);
  const data = await response.json();
  return Response.json(data);
}
