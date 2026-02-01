// POST /api/auth/logout - User logout

import { hashToken } from '../../../lib/auth';
import { deleteSession } from '../../../lib/db';
import { parseCookies, clearSessionCookie, type Env } from '../../../lib/types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['flux_session'];

    if (sessionToken) {
      // Delete session from database
      const tokenHash = await hashToken(sessionToken);
      await deleteSession(env.DB, tokenHash);
    }

    // Clear the session cookie
    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Logged out successfully' },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearSessionCookie(),
      },
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, clear the cookie
    return new Response(JSON.stringify({
      success: true,
      data: { message: 'Logged out' },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearSessionCookie(),
      },
    });
  }
};
