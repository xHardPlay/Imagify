// GET /api/gemini/models - List available Gemini models

import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getApiSettings } from '../../../lib/db';
import { decryptApiKey } from '../../../lib/crypto';
import type { Env } from '../../../lib/types';

// Models known to support vision/images
const VISION_CAPABLE_PATTERNS = [
  'gemini-1.5',
  'gemini-2.0',
  'gemini-pro-vision',
  'gemini-exp',
  'gemini-2.5',
];

// Default models when API is not available
const DEFAULT_MODELS = [
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', supportsVision: true, isRecommended: true },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', supportsVision: true },
  { id: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash (Experimental)', supportsVision: true },
  { id: 'gemini-pro-vision', displayName: 'Gemini Pro Vision', supportsVision: true },
  { id: 'gemini-pro', displayName: 'Gemini Pro', supportsVision: false },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    // Get user's API key
    const settings = await getApiSettings(env.DB, user.id);

    if (!settings?.gemini_api_key_encrypted || !settings?.gemini_api_key_iv) {
      // Return default models if no API key
      return new Response(JSON.stringify({
        success: true,
        data: DEFAULT_MODELS,
      }), {
        status: 200,
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
      return new Response(JSON.stringify({
        success: true,
        data: DEFAULT_MODELS,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch models from Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: true,
        data: DEFAULT_MODELS,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const geminiModels = data.models || [];

    // Filter and transform models
    const models = geminiModels
      .filter((model: any) => {
        return model.supportedGenerationMethods?.includes('generateContent');
      })
      .map((model: any) => {
        const modelId = model.name.replace('models/', '');
        const supportsVision = VISION_CAPABLE_PATTERNS.some(pattern =>
          modelId.toLowerCase().includes(pattern.toLowerCase())
        ) && model.supportedGenerationMethods?.includes('generateContent');

        return {
          id: modelId,
          displayName: model.displayName || modelId,
          supportsVision,
          isRecommended: modelId === 'gemini-1.5-flash' || modelId === 'gemini-2.0-flash',
        };
      })
      .sort((a: any, b: any) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        if (a.supportsVision && !b.supportsVision) return -1;
        if (!a.supportsVision && b.supportsVision) return 1;
        return a.displayName.localeCompare(b.displayName);
      });

    return new Response(JSON.stringify({
      success: true,
      data: models.length > 0 ? models : DEFAULT_MODELS,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get models error:', error);
    return new Response(JSON.stringify({
      success: true,
      data: DEFAULT_MODELS,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
