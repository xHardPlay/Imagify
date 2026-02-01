// GET /api/settings - Get user API settings
// PUT /api/settings - Update API settings

import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getApiSettings, upsertApiSettings } from '../../../lib/db';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../../../lib/crypto';
import type { Env } from '../../../lib/types';

interface UpdateSettingsRequest {
  geminiApiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// GET - Get API settings
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const settings = await getApiSettings(env.DB, user.id);

    if (!settings) {
      // Return default settings
      return new Response(JSON.stringify({
        success: true,
        data: {
          geminiApiKey: null,
          geminiApiKeyMasked: null,
          model: 'gemini-1.5-flash',
          maxTokens: 2000,
          temperature: 0.4,
          hasApiKey: false,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Decrypt API key to show masked version
    let maskedKey: string | null = null;
    let hasApiKey = false;

    if (settings.gemini_api_key_encrypted && settings.gemini_api_key_iv) {
      try {
        const decrypted = await decryptApiKey(
          settings.gemini_api_key_encrypted,
          settings.gemini_api_key_iv,
          env.ENCRYPTION_KEY
        );
        maskedKey = maskApiKey(decrypted);
        hasApiKey = true;
      } catch (e) {
        console.error('Failed to decrypt API key:', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        geminiApiKey: null, // Never return the actual key
        geminiApiKeyMasked: maskedKey,
        model: settings.model,
        maxTokens: settings.max_tokens,
        temperature: settings.temperature,
        hasApiKey,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch settings',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT - Update API settings
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const body: UpdateSettingsRequest = await request.json();
    const { geminiApiKey, model, maxTokens, temperature } = body;

    const updates: {
      gemini_api_key_encrypted?: string | null;
      gemini_api_key_iv?: string | null;
      model?: string;
      max_tokens?: number;
      temperature?: number;
    } = {};

    // Encrypt API key if provided
    if (geminiApiKey !== undefined) {
      if (geminiApiKey && geminiApiKey.trim().length > 0) {
        // Validate API key format
        if (!geminiApiKey.startsWith('AIza')) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid API key format. Google Gemini API keys start with "AIza"',
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const { encrypted, iv } = await encryptApiKey(geminiApiKey, env.ENCRYPTION_KEY);
        updates.gemini_api_key_encrypted = encrypted;
        updates.gemini_api_key_iv = iv;
      } else {
        // Clear API key
        updates.gemini_api_key_encrypted = null;
        updates.gemini_api_key_iv = null;
      }
    }

    if (model !== undefined) {
      updates.model = model;
    }

    if (maxTokens !== undefined) {
      if (maxTokens < 100 || maxTokens > 8000) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Max tokens must be between 100 and 8000',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.max_tokens = maxTokens;
    }

    if (temperature !== undefined) {
      if (temperature < 0 || temperature > 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Temperature must be between 0 and 2',
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.temperature = temperature;
    }

    await upsertApiSettings(env.DB, user.id, updates);

    // Get updated settings
    const updatedSettings = await getApiSettings(env.DB, user.id);

    let maskedKey: string | null = null;
    let hasApiKey = false;

    if (updatedSettings?.gemini_api_key_encrypted && updatedSettings?.gemini_api_key_iv) {
      try {
        const decrypted = await decryptApiKey(
          updatedSettings.gemini_api_key_encrypted,
          updatedSettings.gemini_api_key_iv,
          env.ENCRYPTION_KEY
        );
        maskedKey = maskApiKey(decrypted);
        hasApiKey = true;
      } catch (e) {
        console.error('Failed to decrypt API key:', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        geminiApiKey: null,
        geminiApiKeyMasked: maskedKey,
        model: updatedSettings?.model || 'gemini-1.5-flash',
        maxTokens: updatedSettings?.max_tokens || 2000,
        temperature: updatedSettings?.temperature || 0.4,
        hasApiKey,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update settings',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
