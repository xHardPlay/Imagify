// GET /api/analyses/:id - Get single analysis
// DELETE /api/analyses/:id - Delete analysis

import { authenticateRequest, unauthorizedResponse } from '../../../lib/authHelper';
import { getAnalysisById, deleteAnalysis } from '../../../lib/db';
import type { Env } from '../../../lib/types';

// GET - Get analysis by ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);
  const analysisId = context.params.id as string;

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const analysis = await getAnalysisById(env.DB, analysisId, user.id);

    if (!analysis) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Analysis not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: analysis.id,
        workflowId: analysis.workflow_id,
        workflowName: analysis.workflow_name,
        title: analysis.title,
        resultData: JSON.parse(analysis.result_data),
        thumbnailBase64: analysis.thumbnail_base64,
        localImageId: analysis.local_image_id,
        createdAt: analysis.created_at,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch analysis',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Delete analysis
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { user, error } = await authenticateRequest(request, env.DB);
  const analysisId = context.params.id as string;

  if (!user) {
    return unauthorizedResponse(error);
  }

  try {
    const analysis = await getAnalysisById(env.DB, analysisId, user.id);

    if (!analysis) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Analysis not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteAnalysis(env.DB, analysisId, user.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Analysis deleted successfully',
        localImageId: analysis.local_image_id, // Return so frontend can delete from IndexedDB
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete analysis',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
