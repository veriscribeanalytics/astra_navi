/**
 * AstraNavi Backend API Client
 * 
 * Thin wrapper for fetch that handles service authentication 
 * when calling the FastAPI backend.
 */

const BACKEND_URL = process.env.AI_BACKEND_URL;
const API_KEY = process.env.AI_BACKEND_API_KEY || '';

export type BackendRequestOptions = RequestInit & {
  userEmail?: string;
  accessToken?: string;
};

export async function backendFetch(
  path: string,
  options: BackendRequestOptions = {}
) {
  const { userEmail, accessToken, headers: extraHeaders, ...rest } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...(userEmail ? { 'X-User-Email': userEmail } : {}),
    ...(extraHeaders as Record<string, string> || {}),
  };

  const url = `${BACKEND_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });
    
    return response;
  } catch (error) {
    console.error(`[backendFetch] Error calling ${url}:`, error);
    throw error;
  }
}
