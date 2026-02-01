// Authentication helper for endpoints
import { hashToken } from './auth';
import { getSessionByToken } from './db';
import { parseCookies, type Env, type User } from './types';

export interface AuthResult {
  user: User | null;
  error?: string;
}

export async function authenticateRequest(
  request: Request,
  db: D1Database
): Promise<AuthResult> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['flux_session'];

  if (!sessionToken) {
    return { user: null, error: 'Authentication required' };
  }

  try {
    const tokenHash = await hashToken(sessionToken);
    const sessionData = await getSessionByToken(db, tokenHash);

    if (!sessionData) {
      return { user: null, error: 'Session expired or invalid' };
    }

    return { user: sessionData.user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export function unauthorizedResponse(error: string = 'Authentication required'): Response {
  return new Response(JSON.stringify({
    success: false,
    error,
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
