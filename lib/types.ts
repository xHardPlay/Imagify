// Shared types for Cloudflare Workers

export interface Env {
  DB: D1Database;
  ENCRYPTION_KEY: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface ApiSettings {
  user_id: string;
  gemini_api_key_encrypted: string | null;
  gemini_api_key_iv: string | null;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Variable {
  id: string;
  workflow_id: string;
  name: string;
  type: 'text' | 'number' | 'color' | 'boolean' | 'list';
  description: string | null;
  default_value: string | null;
  required: number;
  sort_order: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Cookie utilities
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const trimmed = cookie.trim();
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const name = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1);
      if (name && value) {
        // Don't decode the token - it's already URL-safe
        cookies[name] = value;
      }
    }
  });

  return cookies;
}

export function createSessionCookie(token: string, maxAge: number = 7 * 24 * 60 * 60): string {
  // Use SameSite=Lax for same-site requests (more compatible)
  return `flux_session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

export function clearSessionCookie(): string {
  return `flux_session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`;
}
