/**
 * AstraNavi Backend API Client
 * 
 * Thin wrapper for fetch that handles service authentication 
 * when calling the FastAPI backend on port 5051.
 */

const BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5051';
const API_KEY = process.env.AI_BACKEND_API_KEY || '';

export type BackendRequestOptions = RequestInit & {
  userEmail?: string;
};

export async function backendFetch(
  path: string,
  options: BackendRequestOptions = {}
) {
  const { userEmail, headers: extraHeaders, ...rest } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
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
