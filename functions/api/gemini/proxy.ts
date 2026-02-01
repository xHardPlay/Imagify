// POST /api/gemini/proxy - Secure proxy for Gemini API calls

import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getApiSettings } from '../../../lib/db';
import { decryptApiKey } from '../../../lib/crypto';
import type { Env } from '../../../lib/types';

interface GeminiProxyRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    // Get user's encrypted API key
    const settings = await getApiSettings(env.DB, user.id);

    if (!settings?.gemini_api_key_encrypted || !settings?.gemini_api_key_iv) {
      return new Response(JSON.stringify({
        success: false,
        error: 'API key not configured. Please add your Gemini API key in settings.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Decrypt API key
    let apiKey: string;
    try {
      apiKey = await decryptApiKey(
        settings.gemini_api_key_encrypted,
        settings.gemini_api_key_iv,
        env.ENCRYPTION_KEY
      );
    } catch (e) {
      console.error('Failed to decrypt API key:', e);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to decrypt API key. Please re-enter your API key in settings.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const body: GeminiProxyRequest = await request.json();
    const { contents, generationConfig } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: contents array is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build generation config from user settings and request
    const finalConfig = {
      temperature: generationConfig?.temperature ?? settings.temperature ?? 0.4,
      maxOutputTokens: generationConfig?.maxOutputTokens ?? settings.max_tokens ?? 2000,
      ...(generationConfig?.topP !== undefined && { topP: generationConfig.topP }),
      ...(generationConfig?.topK !== undefined && { topK: generationConfig.topK }),
    };

    // Forward to Gemini API
    const model = settings.model || 'gemini-1.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: finalConfig,
      }),
    });

    const geminiData = await geminiResponse.json();

    // Handle Gemini API errors
    if (!geminiResponse.ok) {
      let errorMessage = 'Gemini API error';

      if (geminiData.error) {
        if (geminiResponse.status === 429) {
          errorMessage = 'API quota exceeded. Please try again later or check your billing.';
        } else if (geminiResponse.status === 403) {
          errorMessage = 'API key invalid or doesn\'t have permission. Please check your API key.';
        } else if (geminiResponse.status === 400) {
          errorMessage = geminiData.error.message || 'Invalid request to Gemini API';
        } else {
          errorMessage = geminiData.error.message || errorMessage;
        }
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: geminiData.error,
      }), {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return Gemini response
    return new Response(JSON.stringify({
      success: true,
      data: geminiData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gemini proxy error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process request',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
