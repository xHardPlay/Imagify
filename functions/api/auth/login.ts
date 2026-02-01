// POST /api/auth/login - User login

import { generateId, generateSessionToken, hashToken, verifyPassword, getSessionExpiry } from '../../../lib/auth';
import { getUserWithPassword, createSession } from '../../../lib/db';
import { createSessionCookie, type Env } from '../../../lib/types';

interface LoginRequest {
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email and password are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user with password hash
    const user = await getUserWithPassword(env.DB, email);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new session
    const sessionId = generateId();
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = getSessionExpiry();

    await createSession(
      env.DB,
      sessionId,
      user.id,
      tokenHash,
      expiresAt,
      request.headers.get('CF-Connecting-IP') || undefined,
      request.headers.get('User-Agent') || undefined
    );

    // Return success with session cookie
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(sessionToken),
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Login failed. Please try again.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
