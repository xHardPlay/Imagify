// GET /api/analyses - List user analyses
// POST /api/analyses - Create new analysis

import { generateId } from '../../../lib/auth';
import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getAnalysesByUser, createAnalysis } from '../../../lib/db';
import type { Env } from '../../../lib/types';

interface CreateAnalysisRequest {
  workflowId?: string | null;
  workflowName: string;
  title: string;
  resultData: object;
  thumbnailBase64?: string | null;
  localImageId?: string | null;
}

// GET - List analyses
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const analyses = await getAnalysesByUser(env.DB, user.id, limit, offset);

    // Parse result_data JSON for each analysis
    const formattedAnalyses = analyses.map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      workflowName: a.workflow_name,
      title: a.title,
      resultData: JSON.parse(a.result_data),
      thumbnailBase64: a.thumbnail_base64,
      localImageId: a.local_image_id,
      createdAt: a.created_at,
    }));

    return new Response(JSON.stringify({
      success: true,
      data: formattedAnalyses,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get analyses error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch analyses',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Create analysis
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const body: CreateAnalysisRequest = await request.json();
    const { workflowId, workflowName, title, resultData, thumbnailBase64, localImageId } = body;

    // Validate required fields
    if (!workflowName || !title || !resultData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'workflowName, title, and resultData are required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const analysisId = generateId();
    const resultDataString = JSON.stringify(resultData);

    await createAnalysis(
      env.DB,
      analysisId,
      user.id,
      workflowId || null,
      workflowName,
      title,
      resultDataString,
      thumbnailBase64,
      localImageId
    );

    const now = new Date().toISOString();

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: analysisId,
        workflowId: workflowId || null,
        workflowName,
        title,
        resultData,
        thumbnailBase64: thumbnailBase64 || null,
        localImageId: localImageId || null,
        createdAt: now,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create analysis',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
