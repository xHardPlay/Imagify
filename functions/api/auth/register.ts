// POST /api/auth/register - Create new user account

import { generateId, generateSessionToken, hashPassword, hashToken, isValidEmail, isValidPassword, getSessionExpiry } from '../../../lib/auth';
import { getUserByEmail, createUser, createSession } from '../../../lib/db';
import { createSessionCookie, type Env } from '../../../lib/types';

interface RegisterRequest {
  email: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: RegisterRequest = await request.json();
    const { email, password } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email address',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: passwordValidation.error,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(env.DB, email);
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'An account with this email already exists',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const { hash, salt } = await hashPassword(password);

    // Create user
    const userId = generateId();
    await createUser(env.DB, userId, email, hash, salt);

    // Create session
    const sessionId = generateId();
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = getSessionExpiry();

    await createSession(
      env.DB,
      sessionId,
      userId,
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
          id: userId,
          email: email.toLowerCase(),
        },
      },
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(sessionToken),
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Registration failed. Please try again.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
