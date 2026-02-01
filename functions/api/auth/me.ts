// GET /api/auth/me - Get current authenticated user

import { hashToken } from '../../../lib/auth';
import { getSessionByToken } from '../../../lib/db';
import { parseCookies, type Env } from '../../../lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Extract session token from cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['flux_session'];

  if (!sessionToken) {
    return new Response(JSON.stringify({
      success: false,
      data: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const tokenHash = await hashToken(sessionToken);
    const sessionData = await getSessionByToken(env.DB, tokenHash);

    if (!sessionData) {
      return new Response(JSON.stringify({
        success: false,
        data: null,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
        },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return new Response(JSON.stringify({
      success: false,
      data: null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
