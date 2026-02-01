// Global middleware for authentication and CORS

import { hashToken } from '../lib/auth';
import { getSessionByToken } from '../lib/db';
import { parseCookies, type Env } from '../lib/types';

// Routes that don't require authentication (but may still use it if available)
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
];

// Routes that should try to authenticate but not fail if no session
const OPTIONAL_AUTH_ROUTES = [
  '/api/auth/me',
];

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

function getCorsOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  // Return the actual origin, or null if not present (same-origin requests)
  // Never use '*' with credentials
  return origin || null;
}

// Helper to add CORS headers to a response while preserving existing headers
function addCorsHeaders(response: Response, corsHeaders: Record<string, string> | null): Response {
  // If no CORS headers needed (same-origin), return response as-is
  if (!corsHeaders) {
    return response;
  }

  const newHeaders = new Headers();

  // Copy all headers from original response, including Set-Cookie
  // Using forEach to ensure proper handling of multi-value headers
  response.headers.forEach((value, key) => {
    newHeaders.append(key, value);
  });

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only add CORS headers for actual cross-origin requests
  // Compare origin with request host to determine if it's truly cross-origin
  const origin = getCorsOrigin(request);
  const requestHost = url.origin; // e.g., https://flux-studio-ai.pages.dev
  const isCrossOrigin = origin && origin !== requestHost;

  const corsHeaders = isCrossOrigin ? {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': origin,
  } : null;

  console.log(`[Middleware] Origin: ${origin}, Request Host: ${requestHost}, Cross-Origin: ${isCrossOrigin}`);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders || {},
    });
  }

  // Skip auth for non-API routes (static files, pages)
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // Check if this is a public route (no auth needed)
  const isPublicRoute = PUBLIC_ROUTES.some(route => url.pathname === route);

  // Check if this route has optional auth
  const isOptionalAuthRoute = OPTIONAL_AUTH_ROUTES.some(route => url.pathname === route);

  // Extract session token from cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies['flux_session'];

  // Debug logging
  console.log(`[Middleware] ${request.method} ${url.pathname}`);
  console.log(`[Middleware] Cookie header: ${cookieHeader ? 'present' : 'missing'}`);
  console.log(`[Middleware] Session token: ${sessionToken ? 'found' : 'not found'}`);

  // For public routes, just pass through with CORS headers
  if (isPublicRoute) {
    const response = await next();
    // Log Set-Cookie header for debugging
    const setCookie = response.headers.get('Set-Cookie');
    console.log(`[Middleware] Public route response Set-Cookie: ${setCookie ? 'present' : 'missing'}`);
    if (setCookie) {
      console.log(`[Middleware] Set-Cookie value: ${setCookie.substring(0, 50)}...`);
    }

    // Clone the response to ensure all headers are preserved
    // This is important for Set-Cookie headers in Cloudflare Pages
    const clonedHeaders = new Headers();
    response.headers.forEach((value, key) => {
      clonedHeaders.append(key, value);
    });

    // Add CORS headers if needed
    if (corsHeaders) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        clonedHeaders.set(key, value);
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: clonedHeaders,
    });
  }

  // Try to authenticate if there's a session token
  if (sessionToken) {
    try {
      console.log(`[Middleware] Token (first 20 chars): ${sessionToken.substring(0, 20)}...`);
      console.log(`[Middleware] Token length: ${sessionToken.length}`);
      const tokenHash = await hashToken(sessionToken);
      console.log(`[Middleware] Token hash: ${tokenHash}`);
      const sessionData = await getSessionByToken(env.DB, tokenHash);
      console.log(`[Middleware] Session lookup result: ${sessionData ? 'FOUND' : 'NOT FOUND'}`);

      if (sessionData) {
        console.log(`[Middleware] User authenticated: ${sessionData.user.email}`);
        // Attach user to request context for downstream handlers
        (context as any).user = sessionData.user;
        (context as any).session = sessionData.session;
      } else if (!isOptionalAuthRoute) {
        // Session invalid and route requires auth
        return new Response(JSON.stringify({
          success: false,
          error: 'Session expired or invalid',
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...(corsHeaders || {}),
          },
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      if (!isOptionalAuthRoute) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication failed',
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...(corsHeaders || {}),
          },
        });
      }
    }
  } else if (!isOptionalAuthRoute) {
    // No session token and route requires auth
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication required',
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...(corsHeaders || {}),
      },
    });
  }

  // Continue to the handler
  const response = await next();

  // Add CORS headers to response
  return addCorsHeaders(response, corsHeaders);
};
